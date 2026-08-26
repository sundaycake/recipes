# Recipe Specification

Version: 1.1
Status: Active

## Purpose

This document defines the Markdown and YAML front matter conventions
used by recipes in this repository.

## Front Matter

### Required

- `recipe` — Human-readable recipe name.

### Optional

- `description` — Short description of the recipe.
- `image` — Path to the recipe image.
- `category` — Primary recipe category.
- `tags` — List of descriptive tags.
- `yield` — Expected quantity produced.
- `default_scale` — Optional numeric multiplier used when initially displaying a recipe, defaults to 1. Allows decimal values
- `prep_active` — Active preparation time.
- `prep_inactive` — Inactive preparation/resting time.
- `cook_time` — Cooking time.
- `cook_temp` — Cooking temperature.
- `cook_method` — Cooking method.
- `source` — Name of the original source or inspiration.
- `source_url` — URL of the original source.

## Markdown Sections

Recipes may contain:

- Equipment
- Ingredients
- Instructions
- Notes
- Tips
- Substitutions
- Adaptation
- Revision History

## Example


## Ingredient Syntax

Ingredient quantities are written naturally in Markdown.

The parser supports:

- Whole numbers
- Fractions
- Mixed numbers
- Decimal quantities
- Quantity ranges
- Optional parenthetical alternate measurements

Examples:

```text
2 eggs
1/2 cup butter
3 1/2 cups rolled oats
1.5 cups milk
2–3 cloves garlic
3 1/2 cups (350 g) rolled oats
```

## Quantity Conversion

Ingredients that cannot be confidently interpreted numerically are left unchanged when scaling.

Examples:

```text
salt to taste
pepper as needed
a pinch of cinnamon
```

## Alternate measurements

A parenthetical measurement immediately following the primary quantity is treated as an alternate measurement.

For example:
```
3 1/2 cups (350 g) rolled oats
```

contains:
```
* Primary measurement: 3 1/2 cups
* Alternate measurement: 350 g
* Ingredient: rolled oats
```

## Unit conversion

Scaling and unit conversion are separate operations.

Scaling changes the quantity while preserving the author's original units.

Unit conversion changes the displayed unit when the requested conversion is known and reliable.

Ingredient-specific volume-to-mass conversions are not assumed unless an explicit mass equivalent is supplied by the recipe or a trusted ingredient conversion is available.

## Default Scale

The default_scale schema affects ingredient quantities only.

It should **not** automatically change:

prep time
inactive/rest time
cook time
cooking temperature
equipment
instructions
notes
yield
