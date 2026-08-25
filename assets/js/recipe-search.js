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

            const searchableText = [
                item.dataset.recipe,
                item.dataset.description,
                item.dataset.category,
                item.dataset.tags
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matches =
                query === "" ||
                searchableText.includes(query);

            item.hidden = !matches;

            if (matches) {
                visibleRecipes++;
            }
        });

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
