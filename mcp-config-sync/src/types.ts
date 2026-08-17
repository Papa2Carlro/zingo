export interface MCPServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
    url?: string;
    type?: string;
    headers?: Record<string, string>;
    cwd?: string;
    startup_timeout_sec?: number;
}

export interface MCPConfig {
    mcpServers: Record<string, MCPServerConfig>;
}

export interface TargetConfig {
    path: string;
    type: 'json' | 'yaml' | 'toml' | 'markdown';
    mcpKey: string; // key where mcpServers should be placed
    scope?: 'global' | 'project';
    format?: 'standard' | 'vscode' | 'codex' | 'claude';
}