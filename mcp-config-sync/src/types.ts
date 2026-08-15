export interface MCPServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}

export interface MCPConfig {
    mcpServers: Record<string, MCPServerConfig>;
}

export interface TargetConfig {
    path: string;
    type: 'json' | 'yaml' | 'toml' | 'markdown';
    mcpKey: string; // key where mcpServers should be placed
}