import { MCPServerConfig, TargetConfig } from "./types.js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");

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
}

export const DEFAULT_CONFIG: SyncConfig = {
  mcpServers: {},
  targets: [
    // VS Code
    { path: ".vscode/mcp.json", type: "json", mcpKey: "mcpServers" },
    { path: ".vscode/settings.json", type: "json", mcpKey: "mcp.servers" },
    
    // Cursor
    { path: ".cursor/mcp.json", type: "json", mcpKey: "mcpServers" },
    
    // Copilot (VS Code)
    { path: ".copilot/mcp-config.json", "type": "json", "mcpKey": "mcpServers" },
    
    // Generic project configs
    { path: "mcp.json", type: "json", mcpKey: "mcpServers" },
    { path: ".mcp.json", type: "json", mcpKey: "mcpServers" },
    
    // AGENTS.md (special handling)
    { path: "AGENTS.md", type: "markdown", mcpKey: "mcpServers" },
  ],
  searchRoot: process.cwd(),
  skipMissing: true,
  dryRun: false,
};

export async function loadConfig(configPath?: string): Promise<SyncConfig> {
  const { readFile } = await import("fs-extra");
  
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