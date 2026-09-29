import test from 'node:test';
import assert from 'node:assert';
import type { MealPlanDay } from '../types/recipe.ts';

function normalizeRecipeList(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    return [val.trim()];
  }
  return [];
}

test('Normalize legacy single-string and array recipe IDs for meal plans', () => {
  // Legacy string format
  assert.deepStrictEqual(normalizeRecipeList('chicken-marsala'), ['chicken-marsala']);
  assert.deepStrictEqual(normalizeRecipeList(''), []);
  assert.deepStrictEqual(normalizeRecipeList(undefined), []);
  assert.deepStrictEqual(normalizeRecipeList(null), []);

  // Multi-recipe array format
  assert.deepStrictEqual(
    normalizeRecipeList(['chicken-marsala', 'caesar-salad', 'garlic-bread']),
    ['chicken-marsala', 'caesar-salad', 'garlic-bread']
  );
  assert.deepStrictEqual(normalizeRecipeList(['', 'valid-recipe', '   ']), ['valid-recipe']);
});

test('MealPlanDay structure supports multiple recipes per meal including breakfast', () => {
  const dayPlan: MealPlanDay = {
    date: 'day-0',
    dayName: 'Monday',
    breakfast: ['pancakes', 'fruit-salad'],
    lunch: ['turkey-club', 'tomato-soup'],
    dinner: ['roast-chicken', 'roasted-potatoes', 'green-salad', 'chocolate-chip-cookies'],
    notes: 'Family dinner night'
  };

  assert.strictEqual(dayPlan.breakfast.length, 2);
  assert.strictEqual(dayPlan.lunch.length, 2);
  assert.strictEqual(dayPlan.dinner.length, 4);
  assert.ok(dayPlan.dinner.includes('roast-chicken'));
  assert.ok(dayPlan.dinner.includes('green-salad'));
});
