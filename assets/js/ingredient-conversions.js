/*
 * Ingredient-specific conversion database.
 *
 * The database is generated from Google Sheets and
 * exposed to each recipe page by the Jekyll layout.
 *
 * This module is deliberately separate from
 * recipe-ingredients.js so that conversion and
 * scaling remain independent concerns.
 */

(function () {

    "use strict";


    /* ==================================================
       1. UNIT DEFINITIONS
       ================================================== */

    const VOLUME_TO_TBSP = {
        tsp: 1 / 3,
        tbsp: 1,
        "fl oz": 2,
        cup: 16,
        pint: 32,
        quart: 64,
        gallon: 256
    };


    const MASS_TO_GRAMS = {
        g: 1,
        kg: 1000,
        oz: 28.349523125,
        lb: 453.59237
    };


    /*
     * Volume units that can be converted to/from
     * the ingredient-specific tsp/tbsp/cup values.
     *
     * ml and l are handled separately because
     * they represent physical volume rather than
     * US customary measuring units.
     */

    const VOLUME_UNITS = [
        "tsp",
        "tbsp",
        "fl oz",
        "cup",
        "pint",
        "quart",
        "gallon",
        "ml",
        "l"
    ];


    const MASS_UNITS = [
        "g",
        "kg",
        "oz",
        "lb"
    ];


    /* ==================================================
       2. NORMALIZATION
       ================================================== */

    function normalizeText(value) {

        return String(value || "")
            .toLowerCase()
            .trim()
            .replace(/[-_]+/g, " ")
            .replace(/\s+/g, " ");

    }


    /* ==================================================
       3. DATABASE INITIALIZATION
       ================================================== */

    let database = null;

    let lookup = null;


    function initialize() {

        if (database !== null) {
            return;
        }


        const recipe =
            document.querySelector(
                ".recipe-card"
            );


        if (!recipe) {

            database = [];

            lookup = new Map();

            return;

        }


        const encoded =
            recipe.dataset.ingredientConversions;


        if (!encoded) {

            database = [];

            lookup = new Map();

            return;

        }


        try {

            database =
                JSON.parse(encoded);


        } catch (error) {

            console.error(
                "RecipeConversions: unable to parse ingredient conversion data.",
                error
            );

            database = [];

        }


        lookup =
            new Map();


        database.forEach(function (ingredient) {

            if (!ingredient || !ingredient.name) {
                return;
            }


            addLookupEntry(
                ingredient.name,
                ingredient
            );


            if (Array.isArray(ingredient.aliases)) {

                ingredient.aliases.forEach(
                    function (alias) {

                        addLookupEntry(
                            alias,
                            ingredient
                        );

                    }
                );

            }

        });

    }


    function addLookupEntry(
        name,
        ingredient
    ) {

        const normalized =
            normalizeText(name);


        if (!normalized) {
            return;
        }


        /*
         * First matching entry wins.
         *
         * The database generator should already
         * prevent ambiguous aliases.
         */

        if (!lookup.has(normalized)) {

            lookup.set(
                normalized,
                ingredient
            );

        }

    }


    /* ==================================================
       4. INGREDIENT LOOKUP
       ================================================== */

    function findIngredient(name) {

        initialize();


        const normalized =
            normalizeText(name);


        if (!normalized) {
            return null;
        }


        return lookup.get(normalized) || null;

    }


    function findIngredientInText(text) {

        initialize();
    
        const normalized =
            normalizeText(text);
    
        if (!normalized) {
            return null;
        }
    
        /*
         * First try an exact match.
         */
        const exact =
            lookup.get(normalized);
    
        if (exact) {
            return exact;
        }
    
        /*
         * Then look for the longest canonical name or
         * alias at the beginning of the ingredient text.
         *
         * Longest match wins so that, for example,
         * "brown sugar (packed)" is preferred over
         * "brown sugar".
         */
        const candidates = [];
    
        database.forEach(function (ingredient) {
    
            if (!ingredient || !ingredient.name) {
                return;
            }
    
            candidates.push({
                text: normalizeText(ingredient.name),
                ingredient
            });
    
            if (Array.isArray(ingredient.aliases)) {
    
                ingredient.aliases.forEach(function (alias) {
    
                    candidates.push({
                        text: normalizeText(alias),
                        ingredient
                    });
    
                });
    
            }
    
        });
    
        candidates.sort(function (a, b) {
            return b.text.length - a.text.length;
        });
    
        for (const candidate of candidates) {
    
            if (
                normalized === candidate.text ||
                normalized.startsWith(
                    candidate.text + " "
                ) ||
                normalized.startsWith(
                    candidate.text + ","
                ) ||
                normalized.startsWith(
                    candidate.text + "("
                )
            ) {
    
                return candidate.ingredient;
    
            }
    
        }
    
        return null;
    
    }


    function searchIngredients(query) {

        initialize();


        const normalized =
            normalizeText(query);


        if (!normalized) {

            return database.slice();

        }


        return database.filter(
            function (ingredient) {

                if (
                    normalizeText(
                        ingredient.name
                    ).includes(normalized)
                ) {
                    return true;
                }


                return (
                    Array.isArray(
                        ingredient.aliases
                    ) &&
                    ingredient.aliases.some(
                        function (alias) {

                            return normalizeText(
                                alias
                            ).includes(normalized);

                        }
                    )
                );

            }
        );

    }


    /* ==================================================
       5. VOLUME CONVERSION
       ================================================== */

    function volumeToTablespoons(
        quantity,
        unit
    ) {

        if (unit === "ml") {

            return null;

        }


        if (unit === "l") {

            return null;

        }


        if (
            !Object.prototype.hasOwnProperty.call(
                VOLUME_TO_TBSP,
                unit
            )
        ) {

            return null;

        }


        return quantity *
            VOLUME_TO_TBSP[unit];

    }


    function tablespoonsToUnit(
        tablespoons,
        unit
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                VOLUME_TO_TBSP,
                unit
            )
        ) {

            return null;

        }


        return tablespoons /
            VOLUME_TO_TBSP[unit];

    }


    /*
     * Convert an ingredient volume to grams.
     *
     * The database provides grams for tsp,
     * tbsp and cup.
     *
     * For other US volume units we derive
     * their equivalent tablespoons.
     */

    function volumeToGrams(
        ingredient,
        quantity,
        unit
    ) {

        if (
            !ingredient ||
            !ingredient.units
        ) {
            return null;
        }


        /*
         * Direct database conversion.
         */

        if (
            Object.prototype.hasOwnProperty.call(
                ingredient.units,
                unit
            )
        ) {

            return (
                quantity *
                Number(ingredient.units[unit])
            );

        }


        /*
         * Derive US customary volume from
         * tablespoon.
         */

        if (
            unit !== "ml" &&
            unit !== "l" &&
            Object.prototype.hasOwnProperty.call(
                ingredient.units,
                "tbsp"
            )
        ) {

            const tablespoons =
                volumeToTablespoons(
                    quantity,
                    unit
                );


            if (tablespoons !== null) {

                return (
                    tablespoons *
                    Number(ingredient.units.tbsp)
                );

            }

        }


        /*
         * ml/l require a physical density.
         *
         * We intentionally don't infer this from
         * the cup value yet because the site needs
         * one explicit site-wide cup/ml convention.
         */

        return null;

    }


    /* ==================================================
       6. GRAMS → VOLUME
       ================================================== */

    function gramsToVolume(
        ingredient,
        grams,
        unit
    ) {

        if (
            !ingredient ||
            !ingredient.units
        ) {
            return null;
        }


        /*
         * Direct database unit.
         */

        if (
            Object.prototype.hasOwnProperty.call(
                ingredient.units,
                unit
            )
        ) {

            return (
                grams /
                Number(ingredient.units[unit])
            );

        }


        /*
         * Derive other US customary volume
         * units from tablespoon.
         */

        if (
            unit !== "ml" &&
            unit !== "l" &&
            Object.prototype.hasOwnProperty.call(
                ingredient.units,
                "tbsp"
            )
        ) {

            const tablespoons =
                grams /
                Number(
                    ingredient.units.tbsp
                );


            return tablespoonsToUnit(
                tablespoons,
                unit
            );

        }


        return null;

    }


    /* ==================================================
       7. MASS CONVERSION
       ================================================== */

    function massToGrams(
        quantity,
        unit
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                MASS_TO_GRAMS,
                unit
            )
        ) {

            return null;

        }


        return quantity *
            MASS_TO_GRAMS[unit];

    }


    function gramsToMass(
        grams,
        unit
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                MASS_TO_GRAMS,
                unit
            )
        ) {

            return null;

        }


        return grams /
            MASS_TO_GRAMS[unit];

    }


    /* ==================================================
       8. GENERAL CONVERSION
       ================================================== */

    function convert(
        ingredientName,
        quantity,
        fromUnit,
        toUnit
    ) {

        const ingredient =
            typeof ingredientName === "string"
                ? findIngredient(ingredientName)
                : ingredientName;


        if (!ingredient) {

            return null;

        }


        quantity =
            Number(quantity);


        if (
            !Number.isFinite(quantity) ||
            quantity < 0
        ) {

            return null;

        }


        /*
         * Same unit.
         */

        if (fromUnit === toUnit) {

            return quantity;

        }


        /*
         * Mass → mass.
         */

        if (
            MASS_UNITS.includes(fromUnit) &&
            MASS_UNITS.includes(toUnit)
        ) {

            const grams =
                massToGrams(
                    quantity,
                    fromUnit
                );


            return gramsToMass(
                grams,
                toUnit
            );

        }


        /*
         * Volume → mass.
         */

        if (
            VOLUME_UNITS.includes(fromUnit) &&
            MASS_UNITS.includes(toUnit)
        ) {

            const grams =
                volumeToGrams(
                    ingredient,
                    quantity,
                    fromUnit
                );


            if (grams === null) {
                return null;
            }


            return gramsToMass(
                grams,
                toUnit
            );

        }


        /*
         * Mass → volume.
         */

        if (
            MASS_UNITS.includes(fromUnit) &&
            VOLUME_UNITS.includes(toUnit)
        ) {

            const grams =
                massToGrams(
                    quantity,
                    fromUnit
                );


            return gramsToVolume(
                ingredient,
                grams,
                toUnit
            );

        }


        /*
         * Volume → volume.
         */

        if (
            VOLUME_UNITS.includes(fromUnit) &&
            VOLUME_UNITS.includes(toUnit)
        ) {

            /*
             * If both units are directly represented
             * by the ingredient database, convert
             * through grams.
             */

            const grams =
                volumeToGrams(
                    ingredient,
                    quantity,
                    fromUnit
                );


            if (grams === null) {
                return null;
            }


            return gramsToVolume(
                ingredient,
                grams,
                toUnit
            );

        }


        return null;

    }


    /* ==================================================
       9. PUBLIC API
       ================================================== */

    window.RecipeConversions = {

        findIngredient,

        findIngredientInText,

        searchIngredients,

        convert,

        volumeToGrams,

        gramsToVolume,

        massToGrams,

        gramsToMass

    };

})();
