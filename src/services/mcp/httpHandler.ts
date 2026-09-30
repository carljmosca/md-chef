/**
 * MD-Chef HTTP/HTTPS MCP & OpenAPI Handler
 * Supports:
 * - Standard MCP JSON-RPC 2.0 over HTTP POST /mcp
 * - MCP Server-Sent Events (SSE) stream over GET /mcp/sse or GET /mcp
 * - OpenAPI 3.0 specification for ChatGPT Custom GPT Actions over GET /mcp/openapi.json
 * - Full CORS support for localhost and remote origins
 */

import { getSeedRecipes } from '../../data/defaultRecipes.ts';
import { computeNutritionForIngredients, analyzeRecipeNutrition } from '../nutrition.ts';
import type { Recipe } from '../../types/recipe.ts';

// In-memory store for shopping list during session
const inMemoryShoppingList: { item: string; addedAt: string }[] = [];

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export const MCP_TOOLS: MCPToolDefinition[] = [
  {
    name: 'search_recipes',
    description: 'Search recipes by keyword query, cuisine category, ingredients, or tags.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keywords, e.g. "pasta", "chicken", "parmesan"' },
        category: { type: 'string', description: 'Optional cuisine category filter (e.g. "Italian", "Asian", "Desserts")' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_recipe_details',
    description: 'Retrieve full recipe details including structured ingredients, instructions, cooking time, and notes.',
    inputSchema: {
      type: 'object',
      properties: {
        recipeId: { type: 'string', description: 'Recipe identifier path, e.g. "Italian/chicken-marsala.md"' }
      },
      required: ['recipeId']
    }
  },
  {
    name: 'get_random_recipe',
    description: 'Get a randomly selected recipe for meal inspiration, optionally filtered by cuisine.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional category name' }
      }
    }
  },
  {
    name: 'list_categories',
    description: 'List all cuisine categories and recipe counts.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'compute_nutrition',
    description: 'Calculate nutritional facts (calories, macros, vitamins, minerals, % DV) from a list of ingredient strings.',
    inputSchema: {
      type: 'object',
      properties: {
        ingredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of ingredients, e.g. ["2 chicken breasts", "1 tbsp olive oil"]'
        },
        servings: { type: 'number', description: 'Number of servings to divide nutrition across (defaults to 1)' }
      },
      required: ['ingredients']
    }
  },
  {
    name: 'analyze_recipe_nutrition',
    description: 'Calculate comprehensive nutritional breakdown and per-serving facts for a specific recipe.',
    inputSchema: {
      type: 'object',
      properties: {
        recipeId: { type: 'string', description: 'Recipe identifier path, e.g. "Italian/chicken-marsala.md"' }
      },
      required: ['recipeId']
    }
  },
  {
    name: 'add_to_shopping_list',
    description: 'Add items to the grocery shopping list.',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of grocery items to add, e.g. ["2 cups whole milk", "500g penne pasta"]'
        }
      },
      required: ['items']
    }
  },
  {
    name: 'get_shopping_list',
    description: 'Retrieve current grocery shopping list items.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

export function executeTool(name: string, args: any, customRecipes?: Recipe[]): any {
  const recipes = customRecipes || getSeedRecipes();

  switch (name) {
    case 'search_recipes': {
      const q = (args?.query || '').toLowerCase().trim();
      const cat = (args?.category || '').toLowerCase().trim();
      const matches = recipes.filter((r) => {
        const matchesCategory = !cat || (r.category || '').toLowerCase() === cat;
        if (!matchesCategory) return false;
        if (!q) return true;
        const title = r.frontmatter.title || r.id;
        const inTitle = title.toLowerCase().includes(q);
        const inCategory = (r.category || '').toLowerCase().includes(q);
        const inIngredients = r.ingredients.some((i) => (i.item || i.raw || '').toLowerCase().includes(q));
        const inTags = (r.frontmatter.tags || []).some((t) => (t || '').toLowerCase().includes(q));
        return inTitle || inCategory || inIngredients || inTags;
      });
      return {
        count: matches.length,
        recipes: matches.map((r) => ({
          id: r.id,
          title: r.frontmatter.title || r.id,
          category: r.category,
          difficulty: r.frontmatter.difficulty,
          prepTime: r.frontmatter.prep_time,
          cookTime: r.frontmatter.cook_time,
          servings: r.frontmatter.servings
        }))
      };
    }
    case 'get_recipe_details': {
      const id = (args?.recipeId || '').toLowerCase();
      const recipe = recipes.find(
        (r) => r.id.toLowerCase() === id || r.id.toLowerCase().endsWith(id)
      );
      if (!recipe) throw new Error(`Recipe "${args?.recipeId}" not found.`);
      return {
        id: recipe.id,
        title: recipe.frontmatter.title || recipe.id,
        category: recipe.category,
        frontmatter: recipe.frontmatter,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        notes: recipe.notes
      };
    }
    case 'get_random_recipe': {
      const cat = (args?.category || '').toLowerCase().trim();
      const pool = cat ? recipes.filter((r) => (r.category || '').toLowerCase() === cat) : recipes;
      if (pool.length === 0) throw new Error(`No recipes found in category "${args?.category}".`);
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      return {
        id: chosen.id,
        title: chosen.frontmatter.title || chosen.id,
        category: chosen.category,
        difficulty: chosen.frontmatter.difficulty,
        cookTime: chosen.frontmatter.cook_time,
        servings: chosen.frontmatter.servings
      };
    }
    case 'list_categories': {
      const counts: Record<string, number> = {};
      recipes.forEach((r) => {
        counts[r.category] = (counts[r.category] || 0) + 1;
      });
      return {
        totalRecipes: recipes.length,
        categories: Object.entries(counts).map(([name, count]) => ({ name, count }))
      };
    }
    case 'compute_nutrition': {
      const ingredients = Array.isArray(args?.ingredients) ? args.ingredients : [];
      const servings = Number(args?.servings) || 1;
      const normalized = ingredients.map((line: any) => {
        if (typeof line === 'string') return { raw: line, item: line };
        return {
          raw: line.raw || `${line.amount || ''} ${line.unit || ''} ${line.item}`.trim(),
          item: line.item,
          amount: line.amount,
          unit: line.unit
        };
      });
      return computeNutritionForIngredients(normalized, servings);
    }
    case 'analyze_recipe_nutrition': {
      const id = (args?.recipeId || '').toLowerCase();
      const recipe = recipes.find(
        (r) => r.id.toLowerCase() === id || r.id.toLowerCase().endsWith(id)
      );
      if (!recipe) throw new Error(`Recipe "${args?.recipeId}" not found.`);
      return analyzeRecipeNutrition(recipe);
    }
    case 'add_to_shopping_list': {
      const items = Array.isArray(args?.items) ? args.items : [];
      items.forEach((item: any) => {
        inMemoryShoppingList.push({ item: String(item), addedAt: new Date().toISOString() });
      });
      return {
        added: items.length,
        totalItems: inMemoryShoppingList.length,
        shoppingList: inMemoryShoppingList.map((i) => i.item)
      };
    }
    case 'get_shopping_list': {
      return {
        count: inMemoryShoppingList.length,
        items: inMemoryShoppingList.map((i) => i.item)
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-id, *'
};

/**
 * Generates an OpenAPI 3.0 JSON schema for ChatGPT Custom GPT Actions
 */
export function getOpenApiSpec(baseUrl: string = 'https://md-chef.netlify.app'): any {
  return {
    openapi: '3.0.0',
    info: {
      title: 'MD-Chef Culinary MCP API',
      version: '1.0.0',
      description: 'API for searching Markdown recipes, estimating nutritional facts, and managing grocery shopping lists.'
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/mcp': {
        post: {
          operationId: 'executeMcpTool',
          summary: 'Execute an MCP culinary tool',
          description: 'Standard JSON-RPC 2.0 endpoint for tool execution',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jsonrpc: { type: 'string', example: '2.0' },
                    id: { type: 'string', example: '1' },
                    method: { type: 'string', example: 'tools/call' },
                    params: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'search_recipes' },
                        arguments: { type: 'object' }
                      },
                      required: ['name', 'arguments']
                    }
                  },
                  required: ['jsonrpc', 'method', 'params']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful JSON-RPC response',
              content: { 'application/json': { schema: { type: 'object' } } }
            }
          }
        }
      }
    }
  };
}

/**
 * Web Standards Request/Response Handler (for Netlify Functions v2, Edge, Cloudflare, Fetch API)
 */
export async function handleWebRequest(
  req: Request,
  defaultBaseUrl: string = 'https://md-chef.netlify.app'
): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  const url = new URL(req.url, defaultBaseUrl);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  // 1. OpenAPI Specification: /mcp/openapi.json or /api/openapi.json
  if (pathname === '/mcp/openapi.json' || pathname === '/api/openapi.json' || pathname.endsWith('/openapi.json')) {
    return new Response(JSON.stringify(getOpenApiSpec(url.origin), null, 2), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }

  // 2. SSE Stream: /mcp/sse or /mcp with Accept: text/event-stream
  const accept = req.headers.get('accept') || '';
  const isSSE = pathname === '/mcp/sse' || pathname.endsWith('/sse') || (pathname === '/mcp' && accept.includes('text/event-stream'));

  if (req.method === 'GET' && isSSE) {
    const sessionId = `session-${Date.now()}`;
    const encoder = new TextEncoder();
    let interval: any;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${url.origin}/mcp?sessionId=${sessionId}\n\n`));
        interval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': keepalive\n\n'));
          } catch {
            clearInterval(interval);
          }
        }, 15000);
        if (interval && typeof interval === 'object' && typeof (interval as any).unref === 'function') {
          (interval as any).unref();
        }
      },
      cancel() {
        if (interval) clearInterval(interval);
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    });
  }

  // 3. GET /mcp or /api/mcp: returns server metadata and list of tools as JSON
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify(
        {
          name: 'md-chef-mcp',
          version: '1.0.0',
          protocol: 'MCP HTTP / JSON-RPC 2.0',
          endpoints: {
            jsonrpc: `${url.origin}/mcp`,
            sse: `${url.origin}/mcp/sse`,
            openapi: `${url.origin}/mcp/openapi.json`
          },
          tools: MCP_TOOLS
        },
        null,
        2
      ),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }

  // 4. POST /mcp or /api/mcp: JSON-RPC 2.0 tool execution
  if (req.method === 'POST') {
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error: Invalid JSON' }
        }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }

    const { id, method, params } = payload || {};

    if (method === 'notifications/initialized') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (method === 'initialize') {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: id ?? null,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'md-chef-mcp', version: '1.0.0' }
          }
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }

    if (method === 'ping') {
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id: id ?? null, result: {} }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }

    if (method === 'tools/list') {
      return new Response(
        JSON.stringify({ jsonrpc: '2.0', id: id ?? null, result: { tools: MCP_TOOLS } }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' }
        }
      );
    }

    if (method === 'tools/call') {
      const { name, arguments: toolArgs } = params || {};
      try {
        const toolResult = executeTool(name, toolArgs || {});
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: id ?? null,
            result: {
              content: [{ type: 'text', text: JSON.stringify(toolResult, null, 2) }]
            }
          }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' }
          }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: id ?? null,
            result: {
              isError: true,
              content: [{ type: 'text', text: err?.message || String(err) }]
            }
          }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` }
      }),
      {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' }
      }
    );
  }

  return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
}

/**
 * Public HTTP Request Handler for Node.js / Connect servers
 */
export async function handleNodeHttpRequest(
  req: any,
  res: any,
  baseUrl: string = 'https://md-chef.netlify.app'
) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id, *');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url || '/', baseUrl);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  // 1. OpenAPI Specification: /mcp/openapi.json or /api/openapi.json
  if (pathname === '/mcp/openapi.json' || pathname === '/api/openapi.json' || pathname.endsWith('/openapi.json')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.end(JSON.stringify(getOpenApiSpec(url.origin), null, 2));
    return;
  }

  // 2. SSE Stream: /mcp/sse or /mcp with Accept: text/event-stream
  const accept = req.headers?.['accept'] || '';
  const isSSE = pathname === '/mcp/sse' || (pathname === '/mcp' && accept.includes('text/event-stream'));

  if (req.method === 'GET' && isSSE) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.statusCode = 200;

    // Send initial endpoint announcement per MCP SSE spec
    const sessionId = `session-${Date.now()}`;
    res.write(`event: endpoint\ndata: ${url.origin}/mcp?sessionId=${sessionId}\n\n`);

    // Keep connection open with periodic pings
    const interval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 20000);
    if (interval && typeof interval === 'object' && typeof (interval as any).unref === 'function') {
      (interval as any).unref();
    }

    req.on('close', () => {
      clearInterval(interval);
    });
    return;
  }

  // 3. GET /mcp: returns server metadata and list of tools as JSON
  if (req.method === 'GET' && (pathname === '/mcp' || pathname === '/api/mcp')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.end(
      JSON.stringify(
        {
          name: 'md-chef-mcp',
          version: '1.0.0',
          protocol: 'MCP HTTP / JSON-RPC 2.0',
          endpoints: {
            jsonrpc: `${url.origin}/mcp`,
            sse: `${url.origin}/mcp/sse`,
            openapi: `${url.origin}/mcp/openapi.json`
          },
          tools: MCP_TOOLS
        },
        null,
        2
      )
    );
    return;
  }

  // 4. POST /mcp or /api/mcp: JSON-RPC 2.0 tool execution
  if (req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });

    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      try {
        const payload = JSON.parse(body || '{}');
        const { id, method, params } = payload;

        if (method === 'notifications/initialized') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (method === 'initialize') {
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              jsonrpc: '2.0',
              id: id ?? null,
              result: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: { name: 'md-chef-mcp', version: '1.0.0' }
              }
            })
          );
          return;
        }

        if (method === 'ping') {
          res.statusCode = 200;
          res.end(JSON.stringify({ jsonrpc: '2.0', id: id ?? null, result: {} }));
          return;
        }

        if (method === 'tools/list') {
          res.statusCode = 200;
          res.end(JSON.stringify({ jsonrpc: '2.0', id: id ?? null, result: { tools: MCP_TOOLS } }));
          return;
        }

        if (method === 'tools/call') {
          const { name, arguments: toolArgs } = params || {};
          try {
            const toolResult = executeTool(name, toolArgs || {});
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                jsonrpc: '2.0',
                id: id ?? null,
                result: {
                  content: [{ type: 'text', text: JSON.stringify(toolResult, null, 2) }]
                }
              })
            );
          } catch (err: any) {
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                jsonrpc: '2.0',
                id: id ?? null,
                result: {
                  isError: true,
                  content: [{ type: 'text', text: err?.message || String(err) }]
                }
              })
            );
          }
          return;
        }

        res.statusCode = 404;
        res.end(
          JSON.stringify({
            jsonrpc: '2.0',
            id: id ?? null,
            error: { code: -32601, message: `Method not found: ${method}` }
          })
        );
      } catch (err: any) {
        res.statusCode = 400;
        res.end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Parse error: Invalid JSON' }
          })
        );
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
}
