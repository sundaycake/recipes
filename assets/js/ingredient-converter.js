(function () {

    "use strict";


    const recipeCard =
        document.querySelector(".recipe-card");

    if (!recipeCard) {
        return;
    }


    const searchInput =
        document.getElementById(
            "ingredient-converter-search"
        );

    const results =
        document.getElementById(
            "ingredient-converter-results"
        );

    const amountInput =
        document.getElementById(
            "ingredient-converter-amount"
        );

    const fromSelect =
        document.getElementById(
            "ingredient-converter-from"
        );

    const toSelect =
        document.getElementById(
            "ingredient-converter-to"
        );

    const resultInput =
        document.getElementById(
            "ingredient-converter-result"
        );

    const info =
        document.querySelector(
            ".ingredient-converter-info"
        );

    const swapButton =
        document.querySelector(
            ".ingredient-converter-swap"
        );


    if (
        !searchInput ||
        !results ||
        !amountInput ||
        !fromSelect ||
        !toSelect ||
        !resultInput ||
        !info ||
        !swapButton
    ) {
        return;
    }


    let selectedIngredient = null;
    let highlightedIndex = -1;


    /*
     * --------------------------------------------------
     * Clear search button
     * --------------------------------------------------
     */
    
    const clearSearchButton =
        document.createElement("button");
    
    clearSearchButton.type = "button";
    clearSearchButton.className =
        "ingredient-converter-search-clear";
    clearSearchButton.setAttribute(
        "aria-label",
        "Clear ingredient search"
    );
    clearSearchButton.textContent = "×";
    clearSearchButton.hidden = true;
    
    searchInput.parentElement.appendChild(
        clearSearchButton
    );

    /*
     * --------------------------------------------------
     * Helpers
     * --------------------------------------------------
     */

    function clearSearch() {
        searchInput.value = "";
        selectedIngredient = null;
    
        closeResults();
        updateClearSearchButton();
        updateConversion();
    
        searchInput.focus();
    }

    
    function updateClearSearchButton() {

        clearSearchButton.hidden =
            searchInput.value.trim() === "";
    
    }

    clearSearchButton.addEventListener(
        "click",
        function () {
    
            searchInput.value = "";
    
            selectedIngredient = null;
    
            closeResults();
    
            updateClearSearchButton();
    
            updateConversion();
    
            searchInput.focus();
    
        }
    );
    
    function formatNumber(value) {

        if (!Number.isFinite(value)) {
            return "";
        }


        /*
         * Avoid ugly floating-point output while
         * preserving useful precision.
         */
        return String(
            Number(
                value.toFixed(4)
            )
        );

    }


    function unitLabel(unit) {

        const labels = {
            tsp: "tsp",
            tbsp: "Tbsp",
            cup: "cup",
            "fl oz": "fl oz",
            pint: "pint",
            quart: "quart",
            gallon: "gallon",
            g: "g",
            kg: "kg",
            oz: "oz",
            lb: "lb"
        };


        return labels[unit] || unit;

    }


    function closeResults() {

        results.hidden = true;

        searchInput.setAttribute(
            "aria-expanded",
            "false"
        );

        highlightedIndex = -1;

    }


    /*
     * --------------------------------------------------
     * Ingredient search
     * --------------------------------------------------
     */

    function showResults() {

        const query =
            searchInput.value.trim();


        const matches =
            RecipeConversions.searchIngredients(
                query
            ).slice().sort(
                function (a, b) {
                    return a.name.localeCompare(
                        b.name,
                        undefined,
                        {
                            sensitivity: "base"
                        }
                    );
                }
            );


        results.innerHTML = "";

        highlightedIndex = -1;


        if (!matches.length) {

            closeResults();

            return;

        }


        matches.forEach(
            function (ingredient, index) {

                const button =
                    document.createElement("button");

                button.type = "button";

                button.className =
                    "ingredient-converter-result";

                button.setAttribute(
                    "role",
                    "option"
                );

                button.dataset.index =
                    String(index);


                const name =
                    document.createElement("span");

                name.className =
                    "ingredient-converter-result-name";

                name.textContent =
                    ingredient.name;


                button.appendChild(name);


                if (ingredient.note) {

                    const note =
                        document.createElement("span");

                    note.className =
                        "ingredient-converter-result-note";

                    note.textContent =
                        ingredient.note;

                    button.appendChild(note);

                }


                button.addEventListener(
                    "mousedown",
                    function (event) {

                        /*
                         * Prevent the search input from
                         * losing focus before selection.
                         */
                        event.preventDefault();

                    }
                );


                button.addEventListener(
                    "click",
                    function () {

                        selectIngredient(
                            ingredient
                        );

                    }
                );


                results.appendChild(button);

            }
        );


        results.hidden = false;

        searchInput.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    function selectIngredient(
        ingredient
    ) {

        selectedIngredient =
            ingredient;

        searchInput.value =
            ingredient.name;

        updateClearSearchButton();

        closeResults();

        updateConversion();

    }
 
    
    searchInput.addEventListener(
        "input",
        function () {

            selectedIngredient = null;

            updateClearSearchButton();

            showResults();

            updateConversion();

        }
    );


    searchInput.addEventListener(
        "focus",
        function () {

            showResults();

        }
    );


    searchInput.addEventListener(
        "keydown",
        function (event) {

            const items =
                Array.from(
                    results.querySelectorAll(
                        ".ingredient-converter-result"
                    )
                );


            if (
                event.key === "ArrowDown"
            ) {

                if (!items.length) {
                    return;
                }


                event.preventDefault();


                highlightedIndex =
                    Math.min(
                        highlightedIndex + 1,
                        items.length - 1
                    );


                updateHighlightedItem(
                    items
                );

            }


            else if (
                event.key === "ArrowUp"
            ) {

                if (!items.length) {
                    return;
                }


                event.preventDefault();


                highlightedIndex =
                    Math.max(
                        highlightedIndex - 1,
                        0
                    );


                updateHighlightedItem(
                    items
                );

            }


            else if (
                event.key === "Enter"
            ) {

                if (
                    highlightedIndex >= 0 &&
                    highlightedIndex < items.length
                ) {

                    event.preventDefault();

                    items[
                        highlightedIndex
                    ].click();

                }

            }


            else if (
                event.key === "Escape"
            ) {

                clearSearch();
                closeResults();

            }

        }
    );


    function updateHighlightedItem(
        items
    ) {

        items.forEach(
            function (item, index) {

                item.classList.toggle(
                    "is-highlighted",
                    index === highlightedIndex
                );

            }
        );

    }


    document.addEventListener(
        "click",
        function (event) {

            if (
                !event.target.closest(
                    ".ingredient-converter-search"
                )
            ) {

                closeResults();

            }

        }
    );


    /*
     * --------------------------------------------------
     * Conversion
     * --------------------------------------------------
     */

    function updateConversion() {

        resultInput.value = "";

        info.textContent = "";


        if (!selectedIngredient) {

            info.textContent =
                "Select an ingredient to begin.";

            return;

        }


        const amount =
            Number(
                amountInput.value
            );


        if (
            !Number.isFinite(amount) ||
            amount < 0
        ) {

            return;

        }


        const fromUnit =
            fromSelect.value;

        const toUnit =
            toSelect.value;


        const converted =
            RecipeConversions.convert(
                selectedIngredient,
                amount,
                fromUnit,
                toUnit
            );


        if (converted === null) {

            info.textContent =
                "No ingredient-specific conversion is available for this unit.";

            return;

        }


        resultInput.value =
            formatNumber(
                converted
            );


        updateConversionInfo(
            fromUnit,
            toUnit
        );

    }


    function updateConversionInfo(
        fromUnit,
        toUnit
    ) {

        const units =
            selectedIngredient.units;


        /*
         * Give the user a useful reference when
         * one of the database base units is involved.
         */

        if (
            units &&
            Object.prototype.hasOwnProperty.call(
                units,
                fromUnit
            )
        ) {

            info.textContent =
                `1 ${unitLabel(fromUnit)} = ` +
                `${formatNumber(
                    Number(units[fromUnit])
                )} g · ` +
                "Ingredient-specific conversion";

            return;

        }


        if (
            units &&
            Object.prototype.hasOwnProperty.call(
                units,
                toUnit
            )
        ) {

            info.textContent =
                `1 ${unitLabel(toUnit)} = ` +
                `${formatNumber(
                    Number(units[toUnit])
                )} g · ` +
                "Ingredient-specific conversion";

            return;

        }


        info.textContent =
            "Ingredient-specific conversion";

    }


    amountInput.addEventListener(
        "input",
        updateConversion
    );


    fromSelect.addEventListener(
        "change",
        updateConversion
    );


    toSelect.addEventListener(
        "change",
        updateConversion
    );


    swapButton.addEventListener(
        "click",
        function () {

            const oldFrom =
                fromSelect.value;

            fromSelect.value =
                toSelect.value;

            toSelect.value =
                oldFrom;


            /*
             * Preserve the current result as the
             * new input amount where possible.
             */
            const currentResult =
                resultInput.value;


            if (currentResult !== "") {

                amountInput.value =
                    currentResult;

            }


            updateConversion();

            amountInput.focus();

            amountInput.select();

        }
    );


    /*
     * --------------------------------------------------
     * Initial state
     * --------------------------------------------------
     */

    info.textContent =
        "Select an ingredient to begin.";

})();
