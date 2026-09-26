import test from 'node:test';
import assert from 'node:assert';
import {
  extractFrontmatter,
  extractTimers,
  classifyIngredientCategory,
  parseRecipeBody,
  scaleIngredientQuantity
} from './markdownParser.ts';

test('Frontmatter extraction with YAML block', () => {
  const sample = `---
title: Chicken Marsala
servings: 4
difficulty: Easy
tags:
  - italian
  - chicken
credit: Carl Mosca
---

## Ingredients
- [ ] 2 boneless chicken breasts
`;

  const { frontmatter, body } = extractFrontmatter(sample);
  assert.strictEqual(frontmatter.title, 'Chicken Marsala');
  assert.strictEqual(frontmatter.servings, 4);
  assert.strictEqual(frontmatter.difficulty, 'Easy');
  assert.deepStrictEqual(frontmatter.tags, ['italian', 'chicken']);
  assert.strictEqual(frontmatter.credit, 'Carl Mosca');
  assert.ok(body.includes('## Ingredients'));
});

test('Timer extraction from text', () => {
  const text1 = 'Sauté mushrooms for 6-8 minutes until golden browned.';
  const timers1 = extractTimers(text1);
  assert.strictEqual(timers1.length, 1);
  assert.strictEqual(timers1[0].totalSeconds, 8 * 60);

  const text2 = 'Let rest for 30 seconds, then bake for 1 hour.';
  const timers2 = extractTimers(text2);
  assert.strictEqual(timers2.length, 2);
  assert.strictEqual(timers2[0].totalSeconds, 30);
  assert.strictEqual(timers2[1].totalSeconds, 3600);
});

test('Ingredient category classification', () => {
  assert.strictEqual(classifyIngredientCategory('2 boneless skinless chicken breasts'), 'Meat & Seafood');
  assert.strictEqual(classifyIngredientCategory('8 oz fresh mozzarella cheese'), 'Dairy & Refrigerated');
  assert.strictEqual(classifyIngredientCategory('3 cloves garlic, minced'), 'Produce');
  assert.strictEqual(classifyIngredientCategory('1 sheet puff pastry'), 'Bakery');
  assert.strictEqual(classifyIngredientCategory('1 teaspoon kosher salt'), 'Spices & Seasonings');
  assert.strictEqual(classifyIngredientCategory('2 tablespoons extra virgin olive oil'), 'Pantry & Dry Goods');
});

test('Ingredient quantity scaling', () => {
  // Scaling 2x
  assert.strictEqual(scaleIngredientQuantity('2 cups flour', 2), '4 cups flour');
  assert.strictEqual(scaleIngredientQuantity('1/2 teaspoon salt', 2), '1 teaspoon salt');
  assert.strictEqual(scaleIngredientQuantity('3 1/2 cups flour', 2), '7 cups flour');
  // Scaling 0.5x
  assert.strictEqual(scaleIngredientQuantity('4 tablespoons butter', 0.5), '2 tablespoons butter');
});

test('Parse ingredients and instructions from markdown checklists', () => {
  const body = `## Ingredients
### For the Dough
- [ ] 3 1/2 cups flour
- [ ] 1 packet yeast

### For the Sauce
- [ ] 1 can San Marzano tomatoes

## Instructions
1. [ ] Dissolve yeast in warm water for 5 minutes.
2. [ ] Knead dough for 8-10 minutes.
`;

  const { ingredients, instructions } = parseRecipeBody(body, 'test-recipe');
  assert.strictEqual(ingredients.length, 3);
  assert.strictEqual(ingredients[0].item, '3 1/2 cups flour');
  assert.strictEqual(ingredients[0].section, 'For the Dough');
  assert.strictEqual(ingredients[2].section, 'For the Sauce');

  assert.strictEqual(instructions.length, 2);
  assert.strictEqual(instructions[0].stepNumber, 1);
  assert.strictEqual(instructions[0].timers.length, 1);
  assert.strictEqual(instructions[0].timers[0].totalSeconds, 300);
  assert.strictEqual(instructions[1].timers[0].totalSeconds, 600);
});

test('Parse Italian pizza recipe with Dough and Toppings subheadings', () => {
  const pizzaBody = `
## Ingredients
### Dough
- [ ] Ingredients for one pizza: 280 grams / 9.9 oz
- [ ] 170g (6oz) 'zero zero'/all purpose flour
- [ ] 100ml/ 3.5 oz water
- [ ] 1 pinch of fresh yeast - 0.5 grams / 0.018oz
- [ ] 1 teaspoon of salt - 5 grams / 0.17 oz

### Toppings
- [ ] 100g of peeled tomatoes (Roma style)
- [ ] 1 teaspoon of salt
- [ ] Dry oregano (not fresh)
- [ ] Fresh basil cut by hand
- [ ] Extra virgin olive oil

## Instructions Dough
- [ ] Melt the yeast in half a cup of water
- [ ] Sift the flour into a bowl.
`;

  const { ingredients, instructions } = parseRecipeBody(pizzaBody, 'pizza');

  assert.strictEqual(ingredients.length, 10);

  // Dough section items
  assert.strictEqual(ingredients[0].section, 'Dough');
  assert.strictEqual(ingredients[0].raw, 'Ingredients for one pizza: 280 grams / 9.9 oz');
  assert.strictEqual(ingredients[4].section, 'Dough');
  assert.strictEqual(ingredients[4].raw, '1 teaspoon of salt - 5 grams / 0.17 oz');

  // Toppings section items
  assert.strictEqual(ingredients[5].section, 'Toppings');
  assert.strictEqual(ingredients[5].raw, '100g of peeled tomatoes (Roma style)');
  assert.strictEqual(ingredients[9].section, 'Toppings');
  assert.strictEqual(ingredients[9].raw, 'Extra virgin olive oil');

  // Instructions section
  assert.strictEqual(instructions.length, 2);
  assert.strictEqual(instructions[0].section, 'Dough');
});

test('Parse diverse subheading variants like #### and bold headers under ingredients', () => {
  const body = `
## Ingredients
#### For the Crust
- 2 cups flour
- 1/2 cup butter

**For the Filling:**
- 3 apples
- 1/2 cup sugar
`;

  const { ingredients } = parseRecipeBody(body, 'pie');
  assert.strictEqual(ingredients.length, 4);
  assert.strictEqual(ingredients[0].section, 'For the Crust');
  assert.strictEqual(ingredients[1].section, 'For the Crust');
  assert.strictEqual(ingredients[2].section, 'For the Filling');
  assert.strictEqual(ingredients[3].section, 'For the Filling');
});

