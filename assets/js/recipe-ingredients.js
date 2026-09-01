/*
 * Recipe ingredient parsing and scaling
 *
 * The Markdown remains the source of truth.
 * This file provides a machine-readable interpretation
 * for interactive scaling and unit conversion.
 */

(function () {

    "use strict";


    /* ==================================================
       1. UNIT DEFINITIONS
       ================================================== */

    const UNITS = {

        tsp: {
            aliases: ["tsp", "teaspoon", "teaspoons"],
            type: "volume"
        },

        tbsp: {
            aliases: ["tbsp", "Tbsp", "tablespoon", "tablespoons"],
            type: "volume"
        },

        cup: {
            aliases: ["cup", "cups"],
            type: "volume"
        },

        "fl oz": {
            aliases: ["fl oz", "fluid ounce", "fluid ounces"],
            type: "volume"
        },

        pint: {
            aliases: ["pint", "pints"],
            type: "volume"
        },

        quart: {
            aliases: ["quart", "quarts"],
            type: "volume"
        },

        gallon: {
            aliases: ["gallon", "gallons"],
            type: "volume"
        },

        ml: {
            aliases: ["ml", "mL", "milliliter", "milliliters"],
            type: "volume"
        },

        l: {
            aliases: ["l", "L", "liter", "liters"],
            type: "volume"
        },

        g: {
            aliases: ["g", "gram", "grams"],
            type: "mass"
        },

        kg: {
            aliases: ["kg", "kilogram", "kilograms"],
            type: "mass"
        },

        oz: {
            aliases: ["oz", "ounce", "ounces"],
            type: "mass"
        },

        lb: {
            aliases: ["lb", "lbs", "pound", "pounds"],
            type: "mass"
        }

    };


    /* ==================================================
       2. NUMBER PARSING
       ================================================== */

    function parseNumber(value) {

        value = value.trim();

        /*
         * Mixed number:
         *
         * 3 1/2
         */

        const mixedMatch = value.match(
            /^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/
        );

        if (mixedMatch) {

            const whole = parseFloat(mixedMatch[1]);
            const numerator = parseFloat(mixedMatch[2]);
            const denominator = parseFloat(mixedMatch[3]);

            if (denominator !== 0) {
                return whole + numerator / denominator;
            }

            return null;
        }


        /*
         * Fraction:
         *
         * 3/4
         */

        const fractionMatch = value.match(
            /^(\d+)\/(\d+)$/
        );

        if (fractionMatch) {

            const numerator = parseFloat(fractionMatch[1]);
            const denominator = parseFloat(fractionMatch[2]);

            if (denominator !== 0) {
                return numerator / denominator;
            }

            return null;
        }


        /*
         * Decimal or whole number.
         */

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : null;
    }


    /* ==================================================
       3. NUMBER FORMATTING
       ================================================== */

    function formatNumber(value) {

        const commonFractions = [
            [1 / 8, "1/8"],
            [1 / 6, "1/6"],
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
    
        const rounded = Math.round(value);
    
        if (Math.abs(value - rounded) < tolerance) {
            return String(rounded);
        }
    
        const whole = Math.floor(value);
        const fraction = value - whole;
    
        for (const [decimal, text] of commonFractions) {
    
            if (Math.abs(fraction - decimal) < tolerance) {
    
                if (whole === 0) {
                    return text;
                }
    
                return `${whole} ${text}`;
            }
        }
    
        return Number(value.toFixed(2)).toString();
    }


    function formatQuantity(value, unit) {

        /*
         * Grams are practical to measure as whole grams.
         *
         * Example:
         * 57.5 g → 58 g
         */
        if (unit === "g") {
            return String(Math.round(value));
        }
    
        return formatNumber(value);
    }


    function formatUnit(unit, quantity, original) {

        // Abbreviations are invariant.
        if (
            unit === "tsp" ||
            unit === "tbsp" ||
            unit === "g" ||
            unit === "kg" ||
            unit === "oz" ||
            unit === "lb" ||
            unit === "ml" ||
            unit === "l" ||
            unit === "fl oz"
        ) {
            return original;
        }
    
        const singular = {
            cup: "cup",
            pint: "pint",
            quart: "quart",
            gallon: "gallon"
        };
    
        const plural = {
            cup: "cups",
            pint: "pints",
            quart: "quarts",
            gallon: "gallons"
        };
    
        if (
            Object.prototype.hasOwnProperty.call(
                singular,
                unit
            )
        ) {
            return Math.abs(quantity) <= 1
                ? singular[unit]
                : plural[unit];
        }
    
        return original;
    }
    
    /* ==================================================
       4. FRACTION NORMALIZATION
       ================================================== */

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


    /* ==================================================
       5. ALTERNATE MEASUREMENT PARSING
       ================================================== */

    function parseAlternateMeasurement(text) {

        /*
         * Look for:
         *
         * (350 g)
         * (240 ml)
         * (8 oz)
         *
         * We deliberately only recognize parentheses
         * containing a number followed by a known unit.
         */

        const unitAliases = Object.values(UNITS)
            .flatMap(unit => unit.aliases)
            .sort((a, b) => b.length - a.length)
            .map(alias =>
                alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            );

        const unitPattern = unitAliases.join("|");

        const pattern = new RegExp(
            `\\(\\s*(\\d+(?:\\.\\d+)?(?:\\s+\\d+\\/\\d+)?|\\d+\\/\\d+)\\s+(${unitPattern})\\s*\\)`,
            "i"
        );

        const match = text.match(pattern);

        if (!match) {
            return {
                text,
                alternate: null
            };
        }

        const quantity = parseNumber(match[1]);

        if (quantity === null) {
            return {
                text,
                alternate: null
            };
        }

        const unitText = match[2];

        let unit = null;

        for (const [canonical, definition] of Object.entries(UNITS)) {

            if (
                definition.aliases.some(
                    alias =>
                        alias.toLowerCase() === unitText.toLowerCase()
                )
            ) {

                unit = {
                    canonical,
                    type: definition.type,
                    original: unitText
                };

                break;
            }
        }

        if (!unit) {
            return {
                text,
                alternate: null
            };
        }

        return {
            text:
                text.slice(0, match.index) +
                text.slice(match.index + match[0].length),

            alternate: {
                quantity,
                unit
            }
        };
    }


    /* ==================================================
       6. INGREDIENT PARSING
       ================================================== */

    function parseIngredient(text) {

        const original = text;

        text = normalizeFractions(text.trim());

        let modifier = "";

        /*
         * Optional approximation modifier.
         */

        const modifierMatch = text.match(
            /^(about|approximately|roughly)\s+/i
        );

        if (modifierMatch) {

            modifier = modifierMatch[1];
            text = text.slice(modifierMatch[0].length);
        }


        /*
         * Primary quantity.
         *
         * Order matters:
         *
         * 3 1/2
         * 3/4
         * 1.5
         * 3
         */

        const quantityMatch = text.match(
            /^(\d+(?:\.\d+)?\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/
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

        text = text.slice(quantityMatch[0].length).trim();


        /*
         * Optional range.
         *
         * 2-3
         * 2–3
         */

        let maximum = null;

        const rangeMatch = text.match(
            /^(?:-|–|—)\s*(\d+(?:\.\d+)?\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)/
        );

        if (rangeMatch) {

            maximum = parseNumber(rangeMatch[1]);

            text = text.slice(rangeMatch[0].length).trim();
        }


        /*
         * Primary unit.
         */

        let unit = null;

        const unitEntries = Object.entries(UNITS);

        unitEntries.sort((a, b) => {

            const aLength = Math.max(
                ...a[1].aliases.map(alias => alias.length)
            );

            const bLength = Math.max(
                ...b[1].aliases.map(alias => alias.length)
            );

            return bLength - aLength;
        });


        for (const [canonical, definition] of unitEntries) {

            const aliases = [...definition.aliases]
                .sort((a, b) => b.length - a.length);

            const aliasPattern = aliases
                .map(alias =>
                    alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                )
                .join("|");

            const match = text.match(
                new RegExp(
                    `^(${aliasPattern})(?=\\s|$)`,
                    "i"
                )
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
         * Parse an optional alternate measurement.
         */

        const alternateResult =
            parseAlternateMeasurement(text);

        text = alternateResult.text.trim();

        const alternate =
            alternateResult.alternate;


        /*
         * Whatever remains is the ingredient description.
         */

        const ingredient = text;


        return {
            original,
            modifier,
            quantity,
            maximum,
            unit,
            alternate,
            ingredient,
            scalable: true
        };
    }


    /* ==================================================
       7. SCALING
       ================================================== */

    function getAutomaticGrams(
        parsed,
        scale
    ) {
    
        /*
         * No usable primary measurement.
         */
        if (
            !parsed.scalable ||
            !parsed.unit
        ) {
            return null;
        }
    
        /*
         * If the recipe already supplied an alternate
         * measurement, that is authoritative.
         *
         * Do not generate another gram value.
         */
        if (parsed.alternate) {
            return null;
        }
    
        /*
         * Automatic grams are intended for volume
         * measurements only.
         */
        if (
            parsed.unit.type !== "volume"
        ) {
            return null;
        }
    
        /*
         * The conversion database is optional.
         * If it isn't available, fall back to the
         * existing recipe behavior without adding
         * anything.
         */
        if (
            !window.RecipeConversions ||
            typeof RecipeConversions.findIngredientInText !==
                "function"
        ) {
            return null;
        }
    
        const ingredient =
            RecipeConversions.findIngredientInText(
                parsed.ingredient
            );
    
        if (!ingredient) {
            return null;
        }
    
        const scaledQuantity =
            parsed.quantity * scale;
    
        const grams =
            RecipeConversions.volumeToGrams(
                ingredient,
                scaledQuantity,
                parsed.unit.canonical
            );
    
        /*
         * No usable database conversion.
         */
        if (
            grams === null ||
            !Number.isFinite(grams)
        ) {
            return null;
        }
    
        /*
         * Don't display impractically small
         * measurements.
         */
        if (grams < 1) {
            return null;
        }
    
        /*
         * The existing recipe display convention is
         * whole grams.
         */
        return Math.round(grams);
    
    }
    
    function scaleIngredient(parsed, factor) {

        if (!parsed.scalable) {
            return parsed.original;
        }

        const minimum =
            parsed.quantity * factor;

        const scaledQuantity =
            parsed.quantity * factor;
        
        const scaledMaximum =
            parsed.maximum !== null
                ? parsed.maximum * factor
                : null;
        
        const unitQuantity =
            scaledMaximum !== null
                ? scaledMaximum
                : scaledQuantity;

        let result = "";

        if (parsed.modifier) {
            result += parsed.modifier + " ";
        }

        result += formatQuantity(
            scaledQuantity,
            parsed.unit
                ? parsed.unit.canonical
                : null
        );
        
        if (parsed.maximum !== null) {
        
            result += "–";
        
            result += formatQuantity(
                parsed.maximum * factor,
                parsed.unit
                    ? parsed.unit.canonical
                    : null
            );
        }
        
        if (parsed.unit) {
            result += " ";
            result += formatUnit(
                parsed.unit.canonical,
                unitQuantity,
                parsed.unit.original
            );
        }
        
        
        /*
         * Preserve an explicitly written alternate
         * measurement exactly as before.
         */
        if (parsed.alternate) {
        
            result += " (";
        
            result += formatQuantity(
                parsed.alternate.quantity * factor,
                parsed.alternate.unit.canonical
            );
        
            result += " ";
            result += parsed.alternate.unit.original;
            result += ")";
        
        }
        
        
        /*
         * If the Markdown did not provide an alternate
         * measurement, attempt to supply an automatic
         * ingredient-specific gram conversion.
         */
        else {
        
            const automaticGrams =
                getAutomaticGrams(
                    parsed,
                    factor
                );
        
            if (automaticGrams !== null) {
        
                result +=
                    " (" +
                    automaticGrams +
                    " g)";
        
            }
        
        }
        
        
        if (parsed.ingredient) {
        
            result += " ";
            result += parsed.ingredient;
        
        }

        return {
            text: result,
            automaticGrams: automaticGrams !== null
        };
    }


    /* ==================================================
       8. INGREDIENT LIST DISCOVERY
       ================================================== */
    
    function findIngredientLists() {
    
        const heading = document.querySelector(
            ".recipe-content h2#ingredients"
        );
    
        if (!heading) {
            return [];
        }
    
        const lists = [];
    
        let element =
            heading.nextElementSibling;
    
        while (element) {
    
            /*
             * The Ingredients section ends at the
             * next H2 heading.
             *
             * H3 headings such as:
             *
             * ### Dry
             * ### Wet
             *
             * are therefore still part of Ingredients.
             */
            if (element.tagName === "H2") {
                break;
            }
    
            if (element.tagName === "UL") {
                lists.push(element);
            }
    
            element =
                element.nextElementSibling;
        }
    
        return lists;
    }


    /* ==================================================
       9. PUBLIC API
       ================================================== */

    window.RecipeIngredients = {
    
        parse: parseIngredient,
        scale: scaleIngredient,
    
        formatNumber,
    
        findIngredientLists
    
    };


})();

/* ==================================================
   RECIPE SCALING
   ================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const recipe =
            document.querySelector(".recipe-card");

        if (!recipe) {
            return;
        }


        const ingredientLists =
            RecipeIngredients.findIngredientLists();
        
        if (ingredientLists.length === 0) {
            return;
        }

        /*
         * Preserve the original ingredient text.
         *
         * This is important because every scale operation
         * should always calculate from the original 1× recipe.
         */

        const ingredients = [];

        ingredientLists.forEach(function (list) {

        list
            .querySelectorAll("li")
            .forEach(function (item) {
    
                const original =
                    item.textContent.trim();
    
                /*
                 * Optional ingredients are still normal
                 * ingredients for scaling purposes.
                 *
                 * Remove the "Optional:" prefix before
                 * passing the text to the ingredient parser,
                 * then restore it when rendering.
                 */
                const optionalMatch =
                    original.match(
                        /^optional\s*:\s*/i
                    );
    
                const parseText =
                    optionalMatch
                        ? original.slice(
                            optionalMatch[0].length
                        ).trim()
                        : original;
    
                const parsed =
                    RecipeIngredients.parse(
                        parseText
                    );
    
                ingredients.push({
                    element: item,
                    original,
                    parsed,
                    prefix: optionalMatch
                        ? optionalMatch[0]
                        : ""
                });
    
            });
    
    });
        
        /*
         * Find standalone Optional: paragraphs
         * inside the Ingredients section.
         */
        const ingredientsHeading =
            document.querySelector(
                ".recipe-content h2#ingredients"
            );
        
        if (ingredientsHeading) {
        
            let element =
                ingredientsHeading.nextElementSibling;
        
            while (element) {
        
                if (element.tagName === "H2") {
                    break;
                }
        
                if (
                    element.tagName === "P" &&
                    /^optional\s*:/i.test(
                        element.textContent.trim()
                    )
                ) {
        
                    const original =
                        element.textContent.trim();
        
                    const ingredientText =
                        original.replace(
                            /^optional\s*:\s*/i,
                            ""
                        );
        
                    const parsed =
                        RecipeIngredients.parse(
                            ingredientText
                        );
        
                    ingredients.push({
                        element,
                        original,
                        prefix: "Optional: ",
                        parsed
                    });
        
                }
        
                element =
                    element.nextElementSibling;
            }
        
        }

        /*
         * Read the recipe's default scale.
         */

        let currentScale =
            parseFloat(
                recipe.dataset.defaultScale
            );

        if (
            !Number.isFinite(currentScale) ||
            currentScale <= 0
        ) {
            currentScale = 1;
        }


        /*
         * Scale the displayed ingredients.
         */

        function renderIngredients(scale) {

            ingredients.forEach(function (entry) {
        
                if (!entry.parsed.scalable) {
        
                    entry.element.textContent =
                        entry.original;
        
                    return;
                }
        
                const scaled =
                    RecipeIngredients.scale(
                        entry.parsed,
                        scale
                    );
        
                entry.element.textContent =
                    entry.prefix +
                    scaled;
        
            });
        
        }


        /*
         * Update which scale button is selected.
         */

        function updateButtons(scale) {

            document
                .querySelectorAll(
                    ".recipe-scaling [data-scale]"
                )
                .forEach(function (button) {

                    const buttonScale =
                        parseFloat(
                            button.dataset.scale
                        );

                    const selected =
                        buttonScale === scale;

                    button.classList.toggle(
                        "active",
                        selected
                    );

                    button.setAttribute(
                        "aria-pressed",
                        selected
                            ? "true"
                            : "false"
                    );

                });

        }


        /*
         * Read scale notes from the recipe frontmatter.
         */
        let scaleNotes = [];
        
        try {
        
            const rawScaleNotes =
                recipe.dataset.scaleNotes;
        
            if (rawScaleNotes) {
        
                scaleNotes =
                    JSON.parse(rawScaleNotes)
                        .map(function (entry) {
        
                            const parts =
                                entry.split("|")
                                    .map(function (part) {
                                        return part.trim();
                                    });
        
                            const scale =
                                parseFloat(parts.shift());
        
                            return {
                                scale,
                                notes: parts.filter(Boolean)
                            };
        
                        })
                        .filter(function (entry) {
                            return (
                                Number.isFinite(entry.scale) &&
                                entry.notes.length > 0
                            );
                        });
        
            }
        
        } catch (error) {
        
            console.warn(
                "Unable to parse recipe scale notes.",
                error
            );
        
        }


        /*
         * Display scale notes associated with the
         * current scale.
         *
         * If there is no exact match, fall back
         * to the 1× notes.
         */
        function updateScaleNotes(scale) {

            const notesContainer =
                document.querySelector(
                    ".recipe-scale-notes"
                );
        
            if (!notesContainer) {
                return;
            }
        
            notesContainer.innerHTML = "";
        
            if (scaleNotes.length === 0) {
                return;
            }
        
            /*
             * Prefer an exact scale match.
             */
            let matchingNotes =
                scaleNotes.find(function (entry) {
                    return entry.scale === scale;
                });
        
            /*
             * If there is no exact match, fall back
             * to the 1× notes.
             */
            if (!matchingNotes) {
        
                matchingNotes =
                    scaleNotes.find(function (entry) {
                        return entry.scale === 1;
                    });
        
            }
        
            if (!matchingNotes) {
                return;
            }
        
            const label =
                document.createElement("strong");
        
            label.textContent =
                "Scale Notes (" +
                RecipeIngredients.formatNumber(
                    matchingNotes.scale
                ) +
                "×)";
        
            notesContainer.appendChild(label);
        
            matchingNotes.notes.forEach(
                function (note) {
        
                    const line =
                        document.createElement("div");
        
                    line.textContent = note;
        
                    notesContainer.appendChild(line);
        
                }
            );
        
        }


        function updateIngredientsHeading(scale) {

            const heading =
                document.querySelector(
                    ".recipe-content h2#ingredients"
                );
        
            if (!heading) {
                return;
            }
        
            let indicator =
                heading.querySelector(
                    ".recipe-scale-indicator"
                );
        
            /*
             * 1× is the canonical recipe, so
             * there is no indicator.
             */
            if (scale === 1) {
        
                if (indicator) {
                    indicator.remove();
                }
        
                return;
            }
        
            if (!indicator) {
        
                indicator =
                    document.createElement("span");
        
                indicator.className =
                    "recipe-scale-indicator";
        
                heading.appendChild(
                    document.createTextNode(" ")
                );
        
                heading.appendChild(
                    indicator
                );
        
            }
        
            let label;
        
            if (scale === 0.5) {
                label = "Half recipe";
            } else if (scale === 1.5) {
                label = "Scaled to 1.5x";
            } else if (scale === 2) {
                label = "Double recipe";
            } else {
                label =
                    "Scaled to " +
                    RecipeIngredients.formatNumber(scale) +
                    "×";
            }
        
            indicator.textContent =
                "(" + label + ")";
        }

        
        /*
         * Change the current scale.
         */

        function setScale(scale) {

            if (
                !Number.isFinite(scale) ||
                scale <= 0
            ) {
                return;
            }
        
            currentScale = scale;
        
            renderIngredients(
                currentScale
            );
        
            updateButtons(
                currentScale
            );
        
            updateScaleNotes(
                currentScale
            );
        
            updateIngredientsHeading(
                currentScale
            );
        
        }


        /*
         * Wire up the scale buttons.
         */

        document
            .querySelectorAll(
                ".recipe-scaling [data-scale]"
            )
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        setScale(
                            parseFloat(
                                button.dataset.scale
                            )
                        );

                    }
                );

            });


        /*
         * Initial render.
         */

        setScale(currentScale);

    }
);
