import { test, describe } from 'node:test';
import assert from 'node:assert';
import { handleNodeHttpRequest, getOpenApiSpec, executeTool } from './httpHandler.ts';
import { EventEmitter } from 'node:events';

describe('HTTP/HTTPS MCP & OpenAPI Handler', () => {
  test('executeTool searches recipes properly', () => {
    const result = executeTool('search_recipes', { query: 'chicken' });
    assert.ok(result.count > 0);
    assert.ok(result.recipes.some((r: any) => r.title.toLowerCase().includes('chicken')));
  });

  test('executeTool computes nutrition accurately', () => {
    const result = executeTool('compute_nutrition', {
      ingredients: ['2 chicken breasts', '1 tbsp olive oil'],
      servings: 2
    });
    assert.strictEqual(result.servings, 2);
    assert.ok(result.perServing.calories > 0);
    assert.ok(result.perServing.protein > 0);
  });

  test('getOpenApiSpec returns valid OpenAPI 3.0 schema', () => {
    const spec = getOpenApiSpec('http://localhost:5173');
    assert.strictEqual(spec.openapi, '3.0.0');
    assert.ok(spec.paths['/mcp']);
  });

  test('handleNodeHttpRequest returns metadata and tool list on GET /mcp', async () => {
    const req = new EventEmitter() as any;
    req.method = 'GET';
    req.url = '/mcp';
    req.headers = {};

    let responseData = '';
    const headers: Record<string, string> = {};
    const res = {
      statusCode: 200,
      setHeader: (k: string, v: string) => {
        headers[k.toLowerCase()] = v;
      },
      end: (data: string) => {
        responseData = data;
      }
    };

    await handleNodeHttpRequest(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(headers['access-control-allow-origin'], '*');
    const parsed = JSON.parse(responseData);
    assert.strictEqual(parsed.name, 'md-chef-mcp');
    assert.ok(parsed.tools.length >= 7);
  });

  test('handleNodeHttpRequest handles POST /mcp tools/call', async () => {
    const req = new EventEmitter() as any;
    req.method = 'POST';
    req.url = '/mcp';
    req.headers = {};

    let responseData = '';
    const res = {
      statusCode: 200,
      setHeader: () => {},
      end: (data: string) => {
        responseData = data;
      }
    };

    const promise = handleNodeHttpRequest(req, res);
    req.emit(
      'data',
      JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-1',
        method: 'tools/call',
        params: {
          name: 'search_recipes',
          arguments: { query: 'chicken' }
        }
      })
    );
    req.emit('end');

    await promise;
    assert.strictEqual(res.statusCode, 200);
    const parsed = JSON.parse(responseData);
    assert.strictEqual(parsed.id, 'test-1');
    assert.ok(parsed.result.content[0].text.includes('chicken'));
  });

  test('handleNodeHttpRequest blocks non-local requests when localOnly is true', async () => {
    const req = new EventEmitter() as any;
    req.method = 'GET';
    req.url = '/mcp';
    req.headers = { host: 'external-site.com', 'x-forwarded-for': '203.0.113.195' };
    req.socket = { remoteAddress: '203.0.113.195' };

    let responseData = '';
    const res = {
      statusCode: 200,
      setHeader: () => {},
      end: (data: string) => {
        responseData = data;
      }
    };

    await handleNodeHttpRequest(req, res);
    assert.strictEqual(res.statusCode, 403);
    const parsed = JSON.parse(responseData);
    assert.strictEqual(parsed.error, 'Forbidden');
  });
});
