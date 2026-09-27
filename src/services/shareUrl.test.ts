import test from 'node:test';
import assert from 'node:assert';
import { getAppBaseUrl, buildRecipeShareUrl } from './shareUrl.ts';

test('getAppBaseUrl uses custom domain with https', () => {
  const url = getAppBaseUrl('https://recipes.mydomain.com');
  assert.strictEqual(url, 'https://recipes.mydomain.com');
});

test('getAppBaseUrl adds https protocol if omitted', () => {
  const url = getAppBaseUrl('recipes.mydomain.com');
  assert.strictEqual(url, 'https://recipes.mydomain.com');
});

test('getAppBaseUrl strips trailing slashes', () => {
  const url = getAppBaseUrl('https://recipes.mydomain.com///');
  assert.strictEqual(url, 'https://recipes.mydomain.com');
});

test('buildRecipeShareUrl builds correct hash URL with custom domain', () => {
  const shareUrl = buildRecipeShareUrl('Italian/chicken-marsala.md', 'recipes.mydomain.com');
  assert.strictEqual(
    shareUrl,
    'https://recipes.mydomain.com/#/recipe/Italian%2Fchicken-marsala.md'
  );
});
