document.addEventListener("DOMContentLoaded", function () {

    const searchInput =
        document.getElementById("recipe-search");

    const recipeItems =
        document.querySelectorAll(
            ".recipe-index-item"
        );

    const categories =
        document.querySelectorAll(
            ".recipe-index-category"
        );

    const filterButtons =
        document.querySelectorAll(
            ".recipe-index-filter"
        );

    const clearFilterButton =
        document.getElementById(
            "recipe-filter-clear"
        );

    const noResults =
        document.getElementById("no-results");

    if (!searchInput) {
        return;
    }


    let activeFilterType = null;
    let activeFilterValue = null;


    function applyFilters() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();

        let visibleRecipes = 0;


        recipeItems.forEach(function (item) {

            const searchableText = [
                item.dataset.recipe,
                item.dataset.description,
                item.dataset.category,
                item.dataset.tags
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                query === "" ||
                searchableText.includes(query);


            let matchesFilter = true;


            if (activeFilterType === "category") {

                matchesFilter =
                    item.dataset.category ===
                    activeFilterValue;

            }


            if (activeFilterType === "tag") {

                let tags = [];

                try {
                    tags = JSON.parse(
                        item.dataset.tags || "[]"
                    );
                } catch (error) {
                    tags = [];
                }
                
                matchesFilter =
                    tags.some(function (tag) {
                        return tag.trim().toLowerCase() ===
                            activeFilterValue.trim().toLowerCase();
                    });
            }


            const visible =
                matchesSearch &&
                matchesFilter;


            item.classList.toggle(
                "is-hidden",
                !visible
            );


            if (visible) {
                visibleRecipes++;
            }

        });


        categories.forEach(function (category) {

            const visibleItems =
                category.querySelectorAll(
                    ".recipe-index-item:not(.is-hidden)"
                );

            category.classList.toggle(
                "is-hidden",
                visibleItems.length === 0
            );

        });


        noResults.classList.toggle(
            "is-hidden",
            visibleRecipes !== 0
        );


        filterButtons.forEach(
            function (button) {

                const active =
                    button.dataset.filterType ===
                        activeFilterType &&
                    button.dataset.filterValue ===
                        activeFilterValue;

                button.classList.toggle(
                    "is-active",
                    active
                );

            }
        );


        clearFilterButton.hidden =
            activeFilterType === null;

    }


    filterButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const type =
                        button.dataset.filterType;

                    const value =
                        button.dataset.filterValue;


                    /*
                     * Clicking the active filter
                     * again clears it.
                     */
                    if (
                        activeFilterType === type &&
                        activeFilterValue === value
                    ) {
                        activeFilterType = null;
                        activeFilterValue = null;

                    } else {

                        activeFilterType = type;
                        activeFilterValue = value;

                    }


                    applyFilters();

                }
            );

        }
    );


    clearFilterButton.addEventListener(
        "click",
        function () {

            activeFilterType = null;
            activeFilterValue = null;

            applyFilters();

        }
    );


    searchInput.addEventListener(
        "input",
        function () {
            applyFilters();
        }
    );


    applyFilters();

});
