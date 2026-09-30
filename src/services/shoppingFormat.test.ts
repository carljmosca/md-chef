import { test } from 'node:test';
import assert from 'node:assert';
import {
  formatForGoogleKeep,
  formatForGoogleKeepHtml,
  splitIntoKeepBatches,
  GOOGLE_KEEP_URL
} from './shoppingFormat.ts';
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

test('formatForGoogleKeepHtml creates separate escaped list entries', () => {
  const result = formatForGoogleKeepHtml('Milk & eggs\n< flour >');
  assert.strictEqual(result, '<ul><li>Milk &amp; eggs</li><li>&lt; flour &gt;</li></ul>');

  const categorized = formatForGoogleKeepHtml('📌 🛒 Grocery List\n\n[PRODUCE]\nApples');
  assert.strictEqual(
    categorized,
    '<p><strong>📌 🛒 Grocery List</strong></p><p><strong>[PRODUCE]</strong></p><ul><li>Apples</li></ul>'
  );
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

  assert.ok(result.includes('📌 🛒 Grocery Shopping List'));
  assert.ok(result.includes('[PANTRY & DRY GOODS]\n2 cups flour'));
  assert.ok(result.includes('[DAIRY & REFRIGERATED]\n1 cup milk'));
  assert.ok(result.includes('[PRODUCE]\n3 apples'));
});

test('formatForGoogleKeep returns empty string when no items match criteria', () => {
  const allChecked = mockItems.map((it) => ({ ...it, checked: true }));
  assert.strictEqual(formatForGoogleKeep(allChecked, { uncheckedOnly: true }), '');
  assert.strictEqual(formatForGoogleKeep([]), '');
});

test('splitIntoKeepBatches splits items into equal batches when exceeding maxItemsPerBatch', () => {
  const manyItems: ShoppingItem[] = Array.from({ length: 110 }, (_, i) => ({
    id: `item-${i}`,
    name: `Ingredient item ${i + 1}`,
    raw: `Ingredient item ${i + 1}`,
    category: 'Produce',
    checked: false,
    addedAt: '2026-09-26T12:00:00Z'
  }));

  // Batch size 50 -> 3 batches (50, 50, 10)
  const batches = splitIntoKeepBatches(manyItems, { maxItemsPerBatch: 50 });
  assert.strictEqual(batches.length, 3);
  assert.strictEqual(batches[0].itemsCount, 50);
  assert.strictEqual(batches[1].itemsCount, 50);
  assert.strictEqual(batches[2].itemsCount, 10);
  assert.strictEqual(batches[0].label, 'Batch 1 of 3');
  assert.strictEqual(batches[1].label, 'Batch 2 of 3');
  assert.strictEqual(batches[2].label, 'Batch 3 of 3');
  assert.ok(batches[0].text.includes('Ingredient item 1'));
  assert.ok(batches[0].text.includes('Ingredient item 50'));
  assert.ok(!batches[0].text.includes('Ingredient item 51'));
});

test('splitIntoKeepBatches returns single batch when items count is below threshold', () => {
  const batches = splitIntoKeepBatches(mockItems, { maxItemsPerBatch: 50 });
  assert.strictEqual(batches.length, 1);
  assert.strictEqual(batches[0].itemsCount, 2); // 2 unchecked items
  assert.strictEqual(batches[0].label, 'All Items');
});

test('GOOGLE_KEEP_URL is valid', () => {
  assert.strictEqual(GOOGLE_KEEP_URL, 'https://keep.google.com/');
});
