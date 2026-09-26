import test from 'node:test';
import assert from 'node:assert';
import { formatForGoogleKeep, GOOGLE_KEEP_URL } from './shoppingFormat.ts';
import type { ShoppingItem } from '../types/recipe.ts';

const mockItems: ShoppingItem[] = [
  {
    id: '1',
    name: '2 cups flour',
    raw: '2 cups flour',
    category: 'Pantry & Dry Goods',
    checked: false,
    addedAt: '2026-09-26T12:00:00Z'
  },
  {
    id: '2',
    name: '1 cup milk',
    raw: '1 cup milk',
    category: 'Dairy & Refrigerated',
    checked: true,
    addedAt: '2026-09-26T12:00:00Z'
  },
  {
    id: '3',
    name: '3 apples',
    raw: '3 apples',
    category: 'Produce',
    checked: false,
    addedAt: '2026-09-26T12:00:00Z'
  }
];

test('formatForGoogleKeep formats unchecked items as clean single lines by default', () => {
  const result = formatForGoogleKeep(mockItems);
  assert.strictEqual(result, '2 cups flour\n3 apples');
});

test('formatForGoogleKeep includes checked items when uncheckedOnly is false', () => {
  const result = formatForGoogleKeep(mockItems, { uncheckedOnly: false });
  assert.strictEqual(result, '2 cups flour\n1 cup milk\n3 apples');
});

test('formatForGoogleKeep groups by category when includeCategories is true', () => {
  const result = formatForGoogleKeep(mockItems, {
    uncheckedOnly: false,
    includeCategories: true
  });

  assert.ok(result.includes('🛒 Grocery Shopping List'));
  assert.ok(result.includes('[PANTRY & DRY GOODS]\n2 cups flour'));
  assert.ok(result.includes('[DAIRY & REFRIGERATED]\n1 cup milk'));
  assert.ok(result.includes('[PRODUCE]\n3 apples'));
});

test('formatForGoogleKeep returns empty string when no items match criteria', () => {
  const allChecked = mockItems.map((it) => ({ ...it, checked: true }));
  assert.strictEqual(formatForGoogleKeep(allChecked, { uncheckedOnly: true }), '');
  assert.strictEqual(formatForGoogleKeep([]), '');
});

test('GOOGLE_KEEP_URL is valid', () => {
  assert.strictEqual(GOOGLE_KEEP_URL, 'https://keep.google.com/');
});
