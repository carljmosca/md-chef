import { describe, it } from 'node:test';
import assert from 'node:assert';
import { webMCPRegistry } from './registry.ts';
import { registerAllWebMCPTools } from './recipeTools.ts';
import type { Recipe } from '../../types/recipe.ts';

const mockRecipes: Recipe[] = [
  {
    id: 'margherita-pizza',
    filename: 'margherita-pizza.md',
    path: 'Italian/margherita-pizza.md',
    category: 'Italian',
    sha: 'mock-pizza-sha',
    updatedAt: '2026-09-29T12:00:00Z',
    rawContent: '',
    frontmatter: {
      title: 'Classic Margherita Pizza',
      prep_time: '20 mins',
      cook_time: '12 mins',
      servings: 4,
      difficulty: 'Easy',
      tags: ['pizza', 'italian', 'cheese']
    },
    ingredients: [
      { id: '1', raw: '300g all-purpose flour', item: 'all-purpose flour', amount: 300, unit: 'g' },
      { id: '2', raw: '200g mozzarella cheese', item: 'mozzarella cheese', amount: 200, unit: 'g' },
      { id: '3', raw: '1 cup crushed tomatoes', item: 'crushed tomatoes', amount: 1, unit: 'cup' }
    ],
    instructions: [
      { id: '1', stepNumber: 1, text: 'Roll out the dough.', timers: [] },
      { id: '2', stepNumber: 2, text: 'Bake for 12 minutes.', timers: [{ totalSeconds: 720, label: '12 minutes' }] }
    ]
  },
  {
    id: 'chicken-marsala',
    filename: 'chicken-marsala.md',
    path: 'Italian/chicken-marsala.md',
    category: 'Italian',
    sha: 'mock-marsala-sha',
    updatedAt: '2026-09-29T12:00:00Z',
    rawContent: '',
    frontmatter: {
      title: 'Chicken Marsala',
      prep_time: '15 mins',
      cook_time: '20 mins',
      servings: 4,
      difficulty: 'Medium',
      tags: ['chicken', 'skillet']
    },
    ingredients: [
      { id: '1', raw: '4 boneless chicken breasts', item: 'boneless chicken breasts', amount: 4, unit: 'pieces' },
      { id: '2', raw: '8 oz cremini mushrooms', item: 'cremini mushrooms', amount: 8, unit: 'oz' },
      { id: '3', raw: '1/2 cup marsala wine', item: 'marsala wine', amount: 0.5, unit: 'cup' }
    ],
    instructions: [
      { id: '1', stepNumber: 1, text: 'Brown chicken on both sides.', timers: [] }
    ]
  }
];

describe('WebMCP Registry & Recipe Tools', () => {
  it('registers all culinary tools with proper JSON schemas', () => {
    registerAllWebMCPTools({ getRecipes: () => mockRecipes });
    const tools = webMCPRegistry.getTools();

    assert.ok(tools.length >= 8, `Expected at least 8 tools, got ${tools.length}`);
    const toolNames = tools.map(t => t.name);

    assert.ok(toolNames.includes('search_recipes'));
    assert.ok(toolNames.includes('get_recipe_details'));
    assert.ok(toolNames.includes('compute_nutrition'));
    assert.ok(toolNames.includes('analyze_recipe_nutrition'));
    assert.ok(toolNames.includes('add_to_shopping_list'));
  });

  it('searches recipes by keyword query', async () => {
    registerAllWebMCPTools({ getRecipes: () => mockRecipes });
    const result = await webMCPRegistry.executeTool('search_recipes', { query: 'pizza' });

    assert.strictEqual(result.isError, undefined);
    assert.ok(result.content[0].text);
    const data = JSON.parse(result.content[0].text!);
    assert.strictEqual(data.totalMatches, 1);
    assert.strictEqual(data.recipes[0].id, 'margherita-pizza');
  });

  it('computes nutritional facts via WebMCP tool', async () => {
    registerAllWebMCPTools({ getRecipes: () => mockRecipes });
    const result = await webMCPRegistry.executeTool('compute_nutrition', {
      ingredients: [
        { item: 'chicken breast', amount: 2, unit: 'pieces' },
        { item: 'olive oil', amount: 1, unit: 'tbsp' }
      ],
      servings: 2
    });

    assert.strictEqual(result.isError, undefined);
    const data = JSON.parse(result.content[0].text!);
    assert.strictEqual(data.servings, 2);
    assert.ok(data.perServing.calories > 200);
    assert.ok(data.perServing.protein > 20);
  });

  it('analyzes existing recipe nutrition via WebMCP tool', async () => {
    registerAllWebMCPTools({ getRecipes: () => mockRecipes });
    const result = await webMCPRegistry.executeTool('analyze_recipe_nutrition', {
      recipeIdOrTitle: 'Classic Margherita Pizza',
      servings: 4
    });

    assert.strictEqual(result.isError, undefined);
    const data = JSON.parse(result.content[0].text!);
    assert.strictEqual(data.recipeTitle, 'Classic Margherita Pizza');
    assert.strictEqual(data.servings, 4);
    assert.ok(data.perServing.calories > 150);
  });

  it('handles standard MCP JSON-RPC 2.0 initialize, tools/list and tools/call', async () => {
    registerAllWebMCPTools({ getRecipes: () => mockRecipes });

    // 1. initialize
    const initRes = await webMCPRegistry.handleJsonRpc({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize'
    });
    assert.strictEqual(initRes.result.serverInfo.name, 'md-chef-webmcp');

    // 2. tools/list
    const listRes = await webMCPRegistry.handleJsonRpc({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    });
    assert.ok(listRes.result.tools.length >= 8);

    // 3. tools/call
    const callRes = await webMCPRegistry.handleJsonRpc({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list_categories'
      }
    });
    assert.ok(callRes.result.content[0].data.categories.length > 0);
  });
});
