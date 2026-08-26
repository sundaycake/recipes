/*
 * Recipe ingredient parsing and scaling
 *
 * This parser intentionally handles common, unambiguous
 * recipe quantities and leaves ambiguous quantities alone.
 */

(function () {

    "use strict";


    /*
     * Units understood by the parser.
     *
     * The canonical name is used internally.
     */

    const UNITS = {

        tsp: {
            aliases: [
                "tsp",
                "teaspoon",
                "teaspoons"
            ],
            type: "volume"
        },

        tbsp: {
            aliases: [
                "tbsp",
                "Tbsp",
                "tablespoon",
                "tablespoons"
            ],
            type: "volume"
        },

        cup: {
            aliases: [
                "cup",
                "cups"
            ],
            type: "volume"
        },

        "fl oz": {
            aliases: [
                "fl oz",
                "fluid ounce",
                "fluid ounces"
            ],
            type: "volume"
        },

        pint: {
            aliases: [
                "pint",
                "pints"
            ],
            type: "volume"
        },

        quart: {
            aliases: [
                "quart",
                "quarts"
            ],
            type: "volume"
        },

        gallon: {
            aliases: [
                "gallon",
                "gallons"
            ],
            type: "volume"
        },

        ml: {
            aliases: [
                "ml",
                "mL",
                "milliliter",
                "milliliters"
            ],
            type: "volume"
        },

        l: {
            aliases: [
                "l",
                "L",
                "liter",
                "liters"
            ],
            type: "volume"
        },

        g: {
            aliases: [
                "g",
                "gram",
                "grams"
            ],
            type: "mass"
        },

        kg: {
            aliases: [
                "kg",
                "kilogram",
                "kilograms"
            ],
            type: "mass"
        },

        oz: {
            aliases: [
                "oz",
                "ounce",
                "ounces"
            ],
            type: "mass"
        },

        lb: {
            aliases: [
                "lb",
                "lbs",
                "pound",
                "pounds"
            ],
            type: "mass"
        }

    };


    /*
     * Convert a fraction or mixed number to a decimal.
     *
     * Examples:
     *
     * 1/2     -> 0.5
     * 3/4     -> 0.75
     * 3 1/2   -> 3.5
     * 2       -> 2
     */

    function parseNumber(value) {

        value = value.trim();

        if (value.includes(" ")) {

            const parts = value.split(/\s+/);

            if (parts.length === 2) {

                const whole = parseFloat(parts[0]);
                const fraction = parseNumber(parts[1]);

                if (!Number.isNaN(whole) && fraction !== null) {
                    return whole + fraction;
                }
            }
        }

        if (value.includes("/")) {

            const parts = value.split("/");

            if (parts.length === 2) {

                const numerator = parseFloat(parts[0]);
                const denominator = parseFloat(parts[1]);

                if (
                    !Number.isNaN(numerator) &&
                    !Number.isNaN(denominator) &&
                    denominator !== 0
                ) {
                    return numerator / denominator;
                }
            }
        }

        const number = parseFloat(value);

        return Number.isNaN(number)
            ? null
            : number;
    }


    /*
     * Convert a decimal back into a friendly recipe fraction.
     */

    function formatNumber(value) {

        const commonFractions = [
            [0, "0"],
            [1 / 8, "1/8"],
            [1 / 4, "1/4"],
            [1 / 3, "1/3"],
            [3 / 8, "3/8"],
            [1 / 2, "1/2"],
            [5 / 8, "5/8"],
            [2 / 3, "2/3"],
            [3 / 4, "3/4"],
            [7 / 8, "7/8"]
        ];

        const tolerance = 0.01;

        const whole = Math.floor(value);
        const fraction = value - whole;

        if (Math.abs(fraction) < tolerance) {
            return String(whole);
        }

        for (const [decimal, text] of commonFractions) {

            if (Math.abs(fraction - decimal) < tolerance) {

                if (whole === 0) {
                    return text;
                }

                return `${whole} ${text}`;
            }
        }

        /*
         * Fall back to a sensible decimal.
         */

        return Number(value.toFixed(2)).toString();
    }


    /*
     * Normalize Unicode fraction characters.
     *
     * This allows:
     *
     * ½ cup
     *
     * to behave like:
     *
     * 1/2 cup
     */

    function normalizeFractions(text) {

        const fractions = {
            "½": "1/2",
            "⅓": "1/3",
            "⅔": "2/3",
            "¼": "1/4",
            "¾": "3/4",
            "⅕": "1/5",
            "⅖": "2/5",
            "⅗": "3/5",
            "⅘": "4/5",
            "⅙": "1/6",
            "⅚": "5/6",
            "⅛": "1/8",
            "⅜": "3/8",
            "⅝": "5/8",
            "⅞": "7/8"
        };

        return text.replace(
            /[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g,
            character => fractions[character]
        );
    }


    /*
     * Parse the beginning of an ingredient line.
     */

    function parseIngredient(text) {

        const original = text;

        text = normalizeFractions(text.trim());

        /*
         * Look for an optional leading modifier.
         */

        let modifier = "";

        const modifierMatch = text.match(
            /^(about|approximately|roughly)\s+/i
        );

        if (modifierMatch) {

            modifier = modifierMatch[1];
            text = text.slice(modifierMatch[0].length);
        }


        /*
         * Quantity:
         *
         * 2
         * 1/2
         * 3 1/2
         * 1.5
         */

        const quantityMatch = text.match(
            /^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)/
        );

        if (!quantityMatch) {
            return {
                original,
                scalable: false
            };
        }

        const quantityText = quantityMatch[1];

        const quantity = parseNumber(quantityText);

        if (quantity === null) {
            return {
                original,
                scalable: false
            };
        }

        text = text.slice(quantityText.length).trim();


        /*
         * Optional range.
         *
         * Example:
         *
         * 2-3 cloves garlic
         */

        let maximum = null;

        const rangeMatch = text.match(
            /^(?:-|–|—)\s*(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)/
        );

        if (rangeMatch) {

            maximum = parseNumber(rangeMatch[1]);

            text = text.slice(rangeMatch[0].length).trim();
        }


        /*
         * Find a recognized unit.
         */

        let unit = null;

        const unitEntries = Object.entries(UNITS);

        for (const [canonical, definition] of unitEntries) {

            const aliases = [...definition.aliases]
                .sort((a, b) => b.length - a.length);

            const aliasPattern = aliases
                .map(alias =>
                    alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                )
                .join("|");

            const match = text.match(
                new RegExp(`^(${aliasPattern})(?=\\s|$)`, "i")
            );

            if (match) {

                unit = {
                    canonical,
                    type: definition.type,
                    original: match[1]
                };

                text = text.slice(match[0].length).trim();

                break;
            }
        }


        /*
         * If there is no unit, this may still be a count-based
         * ingredient such as "2 eggs".
         */

        const ingredient = text;

        return {
            original,
            modifier,
            quantity,
            maximum,
            unit,
            ingredient,
            scalable: true
        };
    }


    /*
     * Scale a parsed ingredient.
     */

    function scaleIngredient(parsed, factor) {

        if (!parsed.scalable) {
            return parsed.original;
        }

        const minimum = parsed.quantity * factor;

        let result = "";

        if (parsed.modifier) {
            result += parsed.modifier + " ";
        }

        result += formatNumber(minimum);

        if (parsed.maximum !== null) {

            result += "–";
            result += formatNumber(parsed.maximum * factor);
        }

        if (parsed.unit) {
            result += " " + parsed.unit.original;
        }

        result += " " + parsed.ingredient;

        return result;
    }


    /*
     * Expose the parser for later stages.
     */

    window.RecipeIngredients = {
        parse: parseIngredient,
        scale: scaleIngredient,
        formatNumber
    };

})();
