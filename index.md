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
    
        <div class="recipe-index-filters">
    
            <div class="recipe-index-filter-group">
                <h2>Categories</h2>
    
                <div class="recipe-index-filter-list">
                    {% assign categories = site.categories | sort %}
    
                    {% for category in categories %}
                        <button
                            type="button"
                            class="recipe-index-filter"
                            data-filter-type="category"
                            data-filter-value="{{ category[0] | escape }}"
                        >
                            {{ category[0] }}
                            <span class="recipe-index-filter-count">
                                {{ category[1].size }}
                            </span>
                        </button>
                    {% endfor %}
                </div>
            </div>
    
            <div class="recipe-index-filter-group">
                <h2>Tags</h2>
    
                <div class="recipe-index-filter-list">
                    {% assign tags = site.tags | sort %}
    
                    {% for tag in tags %}
                        <button
                            type="button"
                            class="recipe-index-filter"
                            data-filter-type="tag"
                            data-filter-value="{{ tag[0] | escape }}"
                        >
                            {{ tag[0] }}
                            <span class="recipe-index-filter-count">
                                {{ tag[1].size }}
                            </span>
                        </button>
                    {% endfor %}
                </div>
            </div>
    
            <button
                type="button"
                id="recipe-filter-clear"
                class="recipe-index-filter-clear"
                hidden
            >
                Clear filter
            </button>
        </div>
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
