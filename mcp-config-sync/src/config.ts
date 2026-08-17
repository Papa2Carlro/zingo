import { MCPServerConfig, TargetConfig } from "./types.js";
import { fileURLToPath } from "url";
import { dirname, resolve, join } from "path";
import { homedir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const HOME = homedir();

export interface SyncConfig {
  /** MCP servers to sync */
  mcpServers: Record<string, MCPServerConfig>;
  /** Target config files to update */
  targets: TargetConfig[];
  /** Root directory to search for projects (default: current working directory) */
  searchRoot?: string;
  /** Additional project roots to include */
  additionalRoots?: string[];
  /** Whether to skip files that don't exist (default: true) */
  skipMissing?: boolean;
  /** Dry run - don't write changes */
  dryRun?: boolean;
  /** Include global/user-level configs */
  includeGlobal?: boolean;
  /** Only sync global configs (skip project discovery) */
  globalOnly?: boolean;
}

export interface GlobalConfigLocation {
  name: string;
  path: string;
  type: 'json' | 'toml' | 'yaml';
  mcpKey: string;
  format?: 'standard' | 'vscode' | 'codex' | 'claude';
}

export const GLOBAL_CONFIG_LOCATIONS: GlobalConfigLocation[] = [
  // VS Code (global/user)
  { 
    name: "VS Code (global)", 
    path: join(HOME, "Library/Application Support/Code/User/mcp.json"), 
    type: "json", 
    mcpKey: "servers",
    format: "vscode"
  },
  { 
    name: "VS Code (global settings)", 
    path: join(HOME, "Library/Application Support/Code/User/settings.json"), 
    type: "json", 
    mcpKey: "mcp.servers",
    format: "vscode"
  },
  
  // Cursor (global)
  { 
    name: "Cursor (global)", 
    path: join(HOME, ".cursor/mcp.json"), 
    type: "json", 
    mcpKey: "mcpServers",
    format: "standard"
  },
  
  // Copilot (global)
  { 
    name: "Copilot (global)", 
    path: join(HOME, ".copilot/mcp-config.json"), 
    type: "json", 
    mcpKey: "mcpServers",
    format: "standard"
  },
  
  // Codex (global)
  { 
    name: "Codex (global)", 
    path: join(HOME, ".codex/config.toml"), 
    type: "toml", 
    mcpKey: "mcp_servers",
    format: "codex"
  },
  
  // Claude Desktop (global)
  { 
    name: "Claude Desktop (global)", 
    path: join(HOME, "Library/Application Support/Claude/claude_desktop_config.json"), 
    type: "json", 
    mcpKey: "mcpServers",
    format: "claude"
  },
  
  // Claude Agents (global) - for agent configurations
  { 
    name: "Claude Agents (global)", 
    path: join(HOME, ".claude/agents.json"), 
    type: "json", 
    mcpKey: "mcpServers",
    format: "standard"
  },
];

export const DEFAULT_CONFIG: SyncConfig = {
  mcpServers: {},
  targets: [
    // VS Code (project)
    { path: ".vscode/mcp.json", type: "json", mcpKey: "mcpServers", scope: "project" },
    { path: ".vscode/settings.json", type: "json", mcpKey: "mcp.servers", scope: "project" },
    
    // Cursor (project)
    { path: ".cursor/mcp.json", type: "json", mcpKey: "mcpServers", scope: "project" },
    
    // Copilot (VS Code project)
    { path: ".copilot/mcp-config.json", type: "json", mcpKey: "mcpServers", scope: "project" },
    
    // Generic project configs
    { path: "mcp.json", type: "json", mcpKey: "mcpServers", scope: "project" },
    { path: ".mcp.json", type: "json", mcpKey: "mcpServers", scope: "project" },
    
    // AGENTS.md (special handling)
    { path: "AGENTS.md", type: "markdown", mcpKey: "mcpServers", scope: "project" },
  ],
  searchRoot: process.cwd(),
  skipMissing: true,
  dryRun: false,
  includeGlobal: true,
  globalOnly: false,
};

export async function loadConfig(configPath?: string): Promise<SyncConfig> {
  const fsExtra = await import("fs-extra");
  const readFile = fsExtra.default.readFile;
  
  if (!configPath) {
    // Look for config file in standard locations relative to project root
    const possiblePaths = [
      resolve(PROJECT_ROOT, "mcp-sync.config.json"),
      resolve(PROJECT_ROOT, ".mcp-sync.json"),
      resolve(process.cwd(), "mcp-sync.config.json"),
      resolve(process.cwd(), ".mcp-sync.json"),
    ];
    
    for (const path of possiblePaths) {
      try {
        const content = await readFile(path, "utf-8");
        const userConfig = JSON.parse(content);
        return { ...DEFAULT_CONFIG, ...userConfig };
      } catch {
        // Continue to next path
      }
    }
    
    return DEFAULT_CONFIG;
  }
  
  try {
    const resolvedPath = resolve(configPath);
    const content = await readFile(resolvedPath, "utf-8");
    const userConfig = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error) {
    console.warn(`Could not load config from ${configPath}:`, (error as Error).message);
    return DEFAULT_CONFIG;
  }
}