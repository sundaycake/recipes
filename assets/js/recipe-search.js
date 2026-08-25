document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("recipe-search");
    const recipeItems = document.querySelectorAll(".recipe-index-item");
    const categories = document.querySelectorAll(".recipe-index-category");
    const noResults = document.getElementById("no-results");

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener("input", function () {

        const query = searchInput.value
            .trim()
            .toLowerCase();

        let visibleRecipes = 0;

        recipeItems.forEach(function (item) {

            const searchableText =
                item.dataset.search.toLowerCase();

            const matches =
                query === "" ||
                searchableText.includes(query);

            item.hidden = !matches;

            if (matches) {
                visibleRecipes++;
            }
        });


        /*
         * Hide category headings when every recipe
         * within that category is hidden.
         */

        categories.forEach(function (category) {

            const visibleItems =
                category.querySelectorAll(
                    ".recipe-index-item:not([hidden])"
                );

            category.hidden =
                visibleItems.length === 0;
        });


        noResults.hidden =
            visibleRecipes !== 0;

    });

});
