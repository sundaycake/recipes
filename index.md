---
layout: default
title: Recipes
---

<div class="recipe-index">

    <header class="recipe-index-header">
        <h1>Recipes</h1>

        <label class="recipe-search-label" for="recipe-search">
            Search recipes
        </label>

        <input
            id="recipe-search"
            class="recipe-search"
            type="search"
            placeholder="Search recipes..."
            autocomplete="off"
        >
    </header>


    <div id="recipe-results"> 

        {% assign categories = site.recipes | map: "category" | uniq | sort %}

        {% for category in categories %}

            <section
                class="recipe-index-category"
                data-category="{{ category | escape }}"
            >

                <h2>{{ category }}</h2>

                <div class="recipe-index-list">

                    {% assign category_recipes = site.recipes
                        | where: "category", category
                        | sort: "recipe" %}

                    {% for recipe in category_recipes %}

                    <a
                        class="recipe-index-item"
                        href="{{ recipe.url | relative_url }}"
                        data-recipe="{{ recipe.recipe | escape }}"
                        data-description="{{ recipe.description | escape }}"
                        data-category="{{ recipe.category | escape }}"
                        data-tags="{{ recipe.tags | join: ' ' | escape }}"
                    >

                            <div class="recipe-index-name">
                                {{ recipe.recipe }}
                            </div>

                            {% if recipe.description %}
                                <div class="recipe-index-description">
                                    {{ recipe.description }}
                                </div>
                            {% endif %}

                            {% if recipe.tags %}
                                <div class="recipe-index-tags">
                                    {% for tag in recipe.tags %}
                                        <span>{{ tag }}</span>{% unless forloop.last %} · {% endunless %}
                                    {% endfor %}
                                </div>
                            {% endif %}

                        </a>

                    {% endfor %}

                </div>

            </section>

        {% endfor %}

        <p id="no-results" class="recipe-no-results" hidden>
            No recipes found :)
        </p>

    </div>

</div>
