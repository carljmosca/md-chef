export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (input: any) => Promise<any> | any;
}

export interface WebMCPContext {
  registerTool: (tool: WebMCPTool) => Promise<void> | void;
  unregisterTool: (name: string) => void;
  provideContext: (context: { tools: WebMCPTool[] }) => void;
  getTools: () => WebMCPTool[];
  executeTool: (name: string, input: any) => Promise<any>;
}

export interface MCPToolContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: any;
}

export interface MCPToolResult {
  content: MCPToolContent[];
  isError?: boolean;
}

export interface MCPJsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface MCPJsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
