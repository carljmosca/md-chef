import type {
  WebMCPTool,
  WebMCPContext,
  MCPJsonRpcRequest,
  MCPJsonRpcResponse,
  MCPToolResult
} from './types.ts';

export interface ToolCallAuditEntry {
  id: string;
  toolName: string;
  input: any;
  output: any;
  status: 'success' | 'error';
  timestamp: string;
  durationMs: number;
}

export class WebMCPRegistry implements WebMCPContext {
  private tools: Map<string, WebMCPTool> = new Map();
  private auditLog: ToolCallAuditEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private isNativeSupported = false;

  constructor() {
    this.detectAndInit();
  }

  private detectAndInit(): void {
    if (typeof window === 'undefined') return;

    // Detect if browser has native WebMCP (e.g. Chrome 146+ with flag)
    const nav = window.navigator as any;
    const doc = window.document as any;

    if (doc.modelContext && typeof doc.modelContext.registerTool === 'function') {
      this.isNativeSupported = true;
    } else if (nav.modelContext && typeof nav.modelContext.registerTool === 'function') {
      this.isNativeSupported = true;
    }

    // Polyfill / expose standard WebMCP interface on document, navigator, and window
    const contextInterface: WebMCPContext = {
      registerTool: this.registerTool.bind(this),
      unregisterTool: this.unregisterTool.bind(this),
      provideContext: this.provideContext.bind(this),
      getTools: this.getTools.bind(this),
      executeTool: this.executeTool.bind(this)
    };

    try {
      if (!doc.modelContext) {
        Object.defineProperty(doc, 'modelContext', {
          value: contextInterface,
          writable: true,
          configurable: true
        });
      }
      if (!nav.modelContext) {
        Object.defineProperty(nav, 'modelContext', {
          value: contextInterface,
          writable: true,
          configurable: true
        });
      }
      (window as any).modelContext = contextInterface;
      (window as any).__MD_CHEF_WEBMCP_REGISTRY__ = this;
    } catch (e) {
      console.warn('Failed to define modelContext polyfill on document/navigator', e);
    }

    // Listen for cross-frame or extension postMessage JSON-RPC requests
    window.addEventListener('message', this.handleWindowMessage.bind(this));
  }

  public getNativeSupport(): boolean {
    return this.isNativeSupported;
  }

  public async registerTool(tool: WebMCPTool): Promise<void> {
    this.tools.set(tool.name, tool);
    this.notifyChange();

    // If native browser modelContext exists and is separate from our polyfill, register there too
    const doc = typeof document !== 'undefined' ? (document as any) : null;
    if (doc?.modelContext && doc.modelContext !== this && typeof doc.modelContext.registerTool === 'function') {
      try {
        await doc.modelContext.registerTool({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          execute: tool.execute
        });
      } catch (err) {
        console.debug('Native registerTool forwarded:', err);
      }
    }
  }

  public unregisterTool(name: string): void {
    if (this.tools.delete(name)) {
      this.notifyChange();
    }
  }

  public provideContext(context: { tools: WebMCPTool[] }): void {
    this.tools.clear();
    for (const tool of context.tools) {
      this.tools.set(tool.name, tool);
    }
    this.notifyChange();
  }

  public getTools(): WebMCPTool[] {
    return Array.from(this.tools.values());
  }

  public getTool(name: string): WebMCPTool | undefined {
    return this.tools.get(name);
  }

  public async executeTool(name: string, input: any = {}): Promise<MCPToolResult> {
    const tool = this.tools.get(name);
    const start = performance.now();
    const entryId = Math.random().toString(36).substring(2, 9);

    if (!tool) {
      const durationMs = Math.round(performance.now() - start);
      const errorResult: MCPToolResult = {
        isError: true,
        content: [{ type: 'text', text: `Tool '${name}' not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}` }]
      };
      this.addAuditEntry({
        id: entryId,
        toolName: name,
        input,
        output: errorResult,
        status: 'error',
        timestamp: new Date().toLocaleTimeString(),
        durationMs
      });
      return errorResult;
    }

    try {
      const rawResult = await tool.execute(input);
      const durationMs = Math.round(performance.now() - start);

      const formattedResult: MCPToolResult = {
        content: [
          {
            type: 'text',
            text: typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult, null, 2),
            data: rawResult
          }
        ]
      };

      this.addAuditEntry({
        id: entryId,
        toolName: name,
        input,
        output: rawResult,
        status: 'success',
        timestamp: new Date().toLocaleTimeString(),
        durationMs
      });

      return formattedResult;
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - start);
      const errorResult: MCPToolResult = {
        isError: true,
        content: [{ type: 'text', text: `Tool '${name}' failed: ${err?.message || String(err)}` }]
      };

      this.addAuditEntry({
        id: entryId,
        toolName: name,
        input,
        output: errorResult,
        status: 'error',
        timestamp: new Date().toLocaleTimeString(),
        durationMs
      });

      return errorResult;
    }
  }

  public async handleJsonRpc(request: MCPJsonRpcRequest): Promise<MCPJsonRpcResponse> {
    const id = request.id;

    if (request.jsonrpc !== '2.0') {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' }
      };
    }

    switch (request.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {
                listChanged: true
              },
              resources: {}
            },
            serverInfo: {
              name: 'md-chef-webmcp',
              version: '1.0.0'
            }
          }
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: this.getTools().map(t => ({
              name: t.name,
              description: t.description,
              inputSchema: t.inputSchema
            }))
          }
        };

      case 'tools/call': {
        const { name, arguments: args } = request.params || {};
        if (!name) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Missing tool name in tools/call params' }
          };
        }

        const result = await this.executeTool(name, args || {});
        return {
          jsonrpc: '2.0',
          id,
          result
        };
      }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${request.method}` }
        };
    }
  }

  private handleWindowMessage(event: MessageEvent): void {
    const data = event.data;
    if (data && data.type === 'MCP_JSONRPC_REQUEST' && data.request) {
      this.handleJsonRpc(data.request).then(response => {
        event.source?.postMessage(
          { type: 'MCP_JSONRPC_RESPONSE', response },
          { targetOrigin: event.origin === 'null' ? '*' : event.origin }
        );
      });
    }
  }

  private addAuditEntry(entry: ToolCallAuditEntry): void {
    this.auditLog.unshift(entry);
    if (this.auditLog.length > 50) {
      this.auditLog.pop();
    }
    this.notifyChange();
  }

  public getAuditLog(): ToolCallAuditEntry[] {
    return [...this.auditLog];
  }

  public clearAuditLog(): void {
    this.auditLog = [];
    this.notifyChange();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyChange(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('Error in WebMCPRegistry listener', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('modelcontextchanged', {
        detail: { toolsCount: this.tools.size }
      }));
    }
  }
}

// Global Singleton Registry
export const webMCPRegistry = new WebMCPRegistry();
