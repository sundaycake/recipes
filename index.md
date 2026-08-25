---
layout: default
title: Recipes
---

# Recipes

{% assign recipes = site.recipes | sort: "recipe" %}

<ul>
{% for recipe in recipes %}
    <li>
        <a href="{{ recipe.url | relative_url }}">
            {{ recipe.recipe }}
        </a>
    </li>
{% endfor %}
</ul>
