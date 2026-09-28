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

test('Parse notes section without treating its list as ingredients or instructions', () => {
  const body = `## Ingredients
- [ ] 2 oz achiote paste

## Instructions
- [ ] Mix the marinade.

## Notes
Save the remaining paste for another use.

Achiote Paste Alternative
3 tbsp paprika
1 tbsp white vinegar

Marinate for up to 4 hours.
`;

  const { ingredients, instructions, notes } = parseRecipeBody(body, 'pollo-asado');

  assert.strictEqual(ingredients.length, 1);
  assert.strictEqual(instructions.length, 1);
  assert.strictEqual(
    notes,
    'Save the remaining paste for another use.\n\nAchiote Paste Alternative\n3 tbsp paprika\n1 tbsp white vinegar\n\nMarinate for up to 4 hours.'
  );
});

test('Parse chocolate-chip-cookies recipe notes accurately', () => {
  const cookieMarkdown = `---
title: Classic Chocolate Chip Cookies
prep_time: 30
servings: 24
difficulty: Easy
---

## Ingredients

- [ ] 2 cups all-purpose flour
- [ ] 1 cup (2 sticks) butter, softened
- [ ] 3/4 cup granulated sugar
- [ ] 3/4 cup packed brown sugar
- [ ] 2 large eggs
- [ ] 2 teaspoons vanilla extract
- [ ] 1 teaspoon baking soda
- [ ] 1 teaspoon salt
- [ ] 2 cups semi-sweet chocolate chips
- [ ] 1 cup chopped walnuts (optional)

## Instructions

1. [ ] Preheat oven to 350°F (175°C)
2. [ ] In a large bowl, cream together butter, granulated sugar, and brown sugar until light and fluffy
3. [ ] Beat in eggs one at a time, then stir in vanilla extract
4. [ ] In a separate bowl, combine flour, baking soda, and salt
5. [ ] Gradually blend the dry ingredients into the wet mixture
6. [ ] Stir in chocolate chips and walnuts (if using)
7. [ ] Drop rounded tablespoons of dough onto ungreased cookie sheets, spacing them 2 inches apart
8. [ ] Bake for 9-11 minutes or until golden brown around the edges
9. [ ] Cool on baking sheet for 2 minutes
10. [ ] Transfer cookies to a wire rack to cool completely

## Notes

- For chewier cookies, slightly underbake them
- Store in an airtight container for up to 1 week
- Dough can be frozen for up to 3 months
- For best results, use room temperature ingredients
`;

  const { frontmatter, body } = extractFrontmatter(cookieMarkdown);
  const { ingredients, instructions, notes } = parseRecipeBody(body, 'chocolate-chip-cookies');

  assert.strictEqual(frontmatter.title, 'Classic Chocolate Chip Cookies');
  assert.strictEqual(ingredients.length, 10);
  assert.strictEqual(instructions.length, 10);
  assert.ok(notes);
  assert.ok(notes.includes('For chewier cookies, slightly underbake them'));
  assert.ok(notes.includes('Store in an airtight container for up to 1 week'));
  assert.ok(notes.includes('Dough can be frozen for up to 3 months'));
  assert.ok(notes.includes('For best results, use room temperature ingredients'));
});

test('Parse header variations for Notes (e.g. ## Chef\'s Notes, ## Tips, ### Notes)', () => {
  const variants = ['## Chef\'s Notes', '## Tips', '### Notes', '## Note:', '## Baker\'s Notes'];
  for (const header of variants) {
    const md = `## Ingredients\n- [ ] 1 cup flour\n\n## Instructions\n1. [ ] Mix\n\n${header}\n- Keep in a cool dry place.`;
    const { notes } = parseRecipeBody(md, 'test');
    assert.strictEqual(notes, '- Keep in a cool dry place.');
  }
});

test('extractFrontmatter ensures title is always a valid string', () => {
  // Numeric title
  const numericMd = `---\ntitle: 12345\n---\n## Ingredients\n- 1 egg`;
  const { frontmatter: fm1 } = extractFrontmatter(numericMd);
  assert.strictEqual(typeof fm1.title, 'string');
  assert.strictEqual(fm1.title, '12345');

  // Missing title but has markdown header #
  const headerMd = `---\nprep_time: 10\n---\n# Delicious Pizza\n## Ingredients\n- 1 crust`;
  const { frontmatter: fm2 } = extractFrontmatter(headerMd);
  assert.strictEqual(typeof fm2.title, 'string');
  assert.strictEqual(fm2.title, 'Delicious Pizza');

  // Empty frontmatter with no header
  const emptyMd = `---\n---\nSome text`;
  const { frontmatter: fm3 } = extractFrontmatter(emptyMd);
  assert.strictEqual(typeof fm3.title, 'string');
  assert.strictEqual(fm3.title, 'Untitled Recipe');
});

test('Parse notes with subheadings and multiple sections', () => {
  const md = `## Ingredients
- [ ] 2 cups flour

## Instructions
1. [ ] Bake at 350F for 20 minutes

## Notes
### Storage Tips
- Store in an airtight container for up to 3 days.

### Variations
- Add 1/2 cup chocolate chips for a sweet version.

**Make Ahead:**
- Dough can be prepared the night before.
`;

  const { notes } = parseRecipeBody(md, 'test-notes-subtitles');
  assert.ok(notes);
  assert.ok(notes.includes('### Storage Tips'));
  assert.ok(notes.includes('Store in an airtight container for up to 3 days.'));
  assert.ok(notes.includes('### Variations'));
  assert.ok(notes.includes('Add 1/2 cup chocolate chips for a sweet version.'));
  assert.ok(notes.includes('**Make Ahead:**'));
  assert.ok(notes.includes('Dough can be prepared the night before.'));
});



