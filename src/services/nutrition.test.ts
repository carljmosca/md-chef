import { describe, it } from 'node:test';
import assert from 'node:assert';
import { computeNutritionForIngredients } from './nutrition.ts';

describe('nutrition calculator', () => {
  it('computes nutritional breakdown for simple chicken and olive oil ingredients', () => {
    const ingredients = [
      { raw: '2 boneless chicken breasts', item: 'boneless chicken breasts', amount: 2, unit: 'pieces' },
      { raw: '2 tbsp extra-virgin olive oil', item: 'extra-virgin olive oil', amount: 2, unit: 'tbsp' }
    ];

    const result = computeNutritionForIngredients(ingredients, 2);
    assert.strictEqual(result.servings, 2);
    assert.ok(result.total.calories > 500, `Total calories should be > 500, got ${result.total.calories}`);
    assert.ok(result.perServing.protein > 30, `Protein should be > 30g, got ${result.perServing.protein}`);
    assert.ok(result.perServing.fat > 10, `Fat should be > 10g, got ${result.perServing.fat}`);
    assert.ok(result.dietaryHighlights.includes('High Protein'), 'Should detect high protein');
  });

  it('computes pizza ingredients with dough and cheese', () => {
    const ingredients = [
      { raw: '300g all-purpose flour', item: 'all-purpose flour', amount: 300, unit: 'g' },
      { raw: '200g mozzarella cheese', item: 'mozzarella cheese', amount: 200, unit: 'g' },
      { raw: '1 cup crushed tomatoes', item: 'crushed tomatoes', amount: 1, unit: 'cup' }
    ];

    const result = computeNutritionForIngredients(ingredients, 4);
    assert.strictEqual(result.servings, 4);
    assert.ok(result.perServing.calories > 300, `Calories per serving should be > 300, got ${result.perServing.calories}`);
    assert.ok(result.perServing.carbohydrates > 30, `Carbs per serving should be > 30g, got ${result.perServing.carbohydrates}`);
    assert.ok(result.percentDailyValue.calcium > 10, 'Calcium % DV should be positive');
  });

  it('handles empty or unrecognized ingredients gracefully without crashing', () => {
    const ingredients = [
      { raw: 'mysterious magic sprinkle', item: 'mysterious magic sprinkle' }
    ];

    const result = computeNutritionForIngredients(ingredients, 1);
    assert.strictEqual(result.servings, 1);
    assert.strictEqual(result.perServing.calories, 0);
    assert.strictEqual(result.ingredientDetails.length, 1);
  });
});
