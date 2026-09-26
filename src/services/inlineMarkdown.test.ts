import test from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderMarkdownInline } from './inlineMarkdown.ts';

test('renderMarkdownInline returns plain text unmodified when no formatting', () => {
  const result = renderMarkdownInline('Preheat oven to 350F');
  assert.strictEqual(result, 'Preheat oven to 350F');
});

test('renderMarkdownInline parses double asterisks as bold React elements', () => {
  const result = renderMarkdownInline('Beat in **eggs** and then **sugar**');
  assert.ok(Array.isArray(result));
  const strongElements = (result as React.ReactElement[]).filter(
    (el) => React.isValidElement(el) && el.type === 'strong'
  );
  assert.strictEqual(strongElements.length, 2);
  assert.strictEqual(strongElements[0].props.children, 'eggs');
  assert.strictEqual(strongElements[1].props.children, 'sugar');
});

test('renderMarkdownInline parses double underscores as bold React elements', () => {
  const result = renderMarkdownInline('Melt __butter__ in saucepan');
  assert.ok(Array.isArray(result));
  const strongElements = (result as React.ReactElement[]).filter(
    (el) => React.isValidElement(el) && el.type === 'strong'
  );
  assert.strictEqual(strongElements.length, 1);
  assert.strictEqual(strongElements[0].props.children, 'butter');
});

test('renderMarkdownInline parses single asterisks as italic elements', () => {
  const result = renderMarkdownInline('Use *fresh* cilantro');
  assert.ok(Array.isArray(result));
  const emElements = (result as React.ReactElement[]).filter(
    (el) => React.isValidElement(el) && el.type === 'em'
  );
  assert.strictEqual(emElements.length, 1);
  assert.strictEqual(emElements[0].props.children, 'fresh');
});

test('renderMarkdownInline parses markdown links', () => {
  const result = renderMarkdownInline('See [original recipe](https://example.com/recipe)');
  assert.ok(Array.isArray(result));
  const linkElements = (result as React.ReactElement[]).filter(
    (el) => React.isValidElement(el) && el.type === 'a'
  );
  assert.strictEqual(linkElements.length, 1);
  assert.strictEqual(linkElements[0].props.href, 'https://example.com/recipe');
  assert.strictEqual(linkElements[0].props.children, 'original recipe');
});

test('renderMarkdownInline parses inline code backticks', () => {
  const result = renderMarkdownInline('Use `350F` temperature');
  assert.ok(Array.isArray(result));
  const codeElements = (result as React.ReactElement[]).filter(
    (el) => React.isValidElement(el) && el.type === 'code'
  );
  assert.strictEqual(codeElements.length, 1);
  assert.strictEqual(codeElements[0].props.children, '350F');
});
