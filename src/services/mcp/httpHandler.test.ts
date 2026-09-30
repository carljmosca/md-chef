import { test, describe } from 'node:test';
import assert from 'node:assert';
import { handleNodeHttpRequest, handleWebRequest, getOpenApiSpec, executeTool } from './httpHandler.ts';
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
    const spec = getOpenApiSpec('https://md-chef.netlify.app');
    assert.strictEqual(spec.openapi, '3.0.0');
    assert.ok(spec.paths['/mcp']);
  });

  test('handleNodeHttpRequest allows public requests from external hosts', async () => {
    const req = new EventEmitter() as any;
    req.method = 'GET';
    req.url = '/mcp';
    req.headers = { host: 'external-domain.com', 'x-forwarded-for': '203.0.113.195' };
    req.socket = { remoteAddress: '203.0.113.195' };

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

  test('handleWebRequest handles OPTIONS with CORS headers', async () => {
    const req = new Request('https://md-chef.netlify.app/mcp', { method: 'OPTIONS' });
    const res = await handleWebRequest(req);
    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get('Access-Control-Allow-Origin'), '*');
  });

  test('handleWebRequest handles GET /mcp with metadata', async () => {
    const req = new Request('https://md-chef.netlify.app/mcp', { method: 'GET' });
    const res = await handleWebRequest(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.name, 'md-chef-mcp');
    assert.ok(body.tools.length >= 7);
  });

  test('handleWebRequest handles GET /mcp/openapi.json', async () => {
    const req = new Request('https://md-chef.netlify.app/mcp/openapi.json', { method: 'GET' });
    const res = await handleWebRequest(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.openapi, '3.0.0');
    assert.ok(body.servers[0].url.includes('netlify.app'));
  });

  test('handleWebRequest handles GET /mcp/sse stream', async () => {
    const req = new Request('https://md-chef.netlify.app/mcp/sse', {
      method: 'GET',
      headers: { Accept: 'text/event-stream' }
    });
    const res = await handleWebRequest(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('Content-Type'), 'text/event-stream');
    assert.ok(res.body);
    const reader = res.body.getReader();
    const { value } = await reader.read();
    assert.ok(value);
    await reader.cancel();
  });

  test('handleWebRequest handles POST /mcp initialize and tools/call', async () => {
    // initialize
    const initReq = new Request('https://md-chef.netlify.app/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'init-1',
        method: 'initialize',
        params: {}
      })
    });
    const initRes = await handleWebRequest(initReq);
    assert.strictEqual(initRes.status, 200);
    const initData = await initRes.json();
    assert.strictEqual(initData.result.serverInfo.name, 'md-chef-mcp');

    // tools/call
    const callReq = new Request('https://md-chef.netlify.app/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-1',
        method: 'tools/call',
        params: {
          name: 'search_recipes',
          arguments: { query: 'pizza' }
        }
      })
    });
    const callRes = await handleWebRequest(callReq);
    assert.strictEqual(callRes.status, 200);
    const callData = await callRes.json();
    assert.ok(callData.result.content[0].text.includes('Pizza'));
  });
});
