import { findProjectRoots, readConfigFile, writeConfigFile, updateMarkdownMCPConfig, deepMerge, setNestedValue } from "./utils.js";
import { loadConfig, SyncConfig, GLOBAL_CONFIG_LOCATIONS } from "./config.js";
import { MCPServerConfig, TargetConfig } from "./types.js";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { syncMCPConfigs } from "./sync.js";
import { pathExists } from "fs-extra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CLI entry point
async function main() {
    const args = process.argv.slice(2);
    
    // Parse CLI args
    let configPath: string | undefined;
    let dryRun = false;
    let searchRoot: string | undefined;
    let listGlobal = false;
    let globalOnly = false;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--config" || args[i] === "-c") {
            configPath = args[++i];
        } else if (args[i] === "--dry-run" || args[i] === "-d") {
            dryRun = true;
        } else if (args[i] === "--root" || args[i] === "-r") {
            searchRoot = args[++i];
        } else if (args[i] === "--list-global" || args[i] === "-l") {
            listGlobal = true;
        } else if (args[i] === "--global-only" || args[i] === "-g") {
            globalOnly = true;
        } else if (args[i] === "--help" || args[i] === "-h") {
            console.log(`
Usage: mcp-sync [options]

Options:
  -c, --config <path>       Path to config file (default: auto-detect)
  -d, --dry-run             Show what would be changed without writing
  -r, --root <path>         Root directory to search for projects
  -l, --list-global         List all global config locations and their status
  -g, --global-only         Only sync global configs (skip project discovery)
  -h, --help                Show this help message

Config file (mcp-sync.config.json):
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": { "KEY": "value" }
    }
  },
  "targets": [
    { "path": ".vscode/mcp.json", "type": "json", "mcpKey": "mcpServers" }
  ],
  "searchRoot": "/path/to/search",
  "additionalRoots": ["/extra/path"],
  "skipMissing": true,
  "dryRun": false,
  "includeGlobal": true,
  "globalOnly": false
}
`);
            process.exit(0);
        }
    }
    
    const config = await loadConfig(configPath);
    
    // Override with CLI args
    if (dryRun) config.dryRun = true;
    if (searchRoot) config.searchRoot = searchRoot;
    if (globalOnly) config.globalOnly = true;
    
    if (listGlobal) {
        await listGlobalConfigs();
        process.exit(0);
    }
    
    if (Object.keys(config.mcpServers).length === 0) {
        console.error("❌ No MCP servers configured. Please provide a config file or use --config.");
        process.exit(1);
    }
    
    const result = await syncMCPConfigs(config);
    
    // Print logs
    for (const log of result.logs) {
        console.log(log);
    }
    
    if (result.errors > 0) {
        process.exit(1);
    }
}

async function listGlobalConfigs() {
    console.log("🌍 Global MCP Config Locations:\n");
    
    for (const loc of GLOBAL_CONFIG_LOCATIONS) {
        const exists = await pathExists(loc.path);
        const status = exists ? "✅ EXISTS" : "❌ NOT FOUND";
        console.log(`  ${status}  ${loc.name}`);
        console.log(`         Path: ${loc.path}`);
        console.log(`         Format: ${loc.format || 'standard'} (${loc.type})`);
        console.log(`         Key: ${loc.mcpKey}`);
        console.log("");
    }
}

main().catch(console.error);