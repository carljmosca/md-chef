import { handleWebRequest } from '../../src/services/mcp/httpHandler.ts';

/**
 * Netlify Function v2 entrypoint for Public MD-Chef MCP & OpenAPI Server
 * Routes handled:
 * - GET  /mcp              -> Server metadata & tools JSON
 * - GET  /mcp/sse          -> MCP Server-Sent Events stream (Claude Desktop, etc.)
 * - GET  /mcp/openapi.json -> OpenAPI 3.0 specification for ChatGPT Custom GPT Actions
 * - POST /mcp              -> MCP JSON-RPC 2.0 tool execution
 * - OPTIONS *              -> CORS preflight responses
 */
export default async function handler(req: Request, _context?: any): Promise<Response> {
  return await handleWebRequest(req);
}

export const config = {
  path: ['/mcp', '/mcp/*']
};
