import { findProjectRoots, readConfigFile, writeConfigFile, updateMarkdownMCPConfig, deepMerge, setNestedValue } from "./utils.js";
import { loadConfig, SyncConfig } from "./config.js";
import { MCPServerConfig, TargetConfig } from "./types.js";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function syncMCPConfigs(config: SyncConfig) {
    console.log("🔍 Finding project roots...");
    const projectRoots = await findProjectRoots(config.searchRoot || process.cwd(), config.additionalRoots);
    console.log(`Found ${projectRoots.length} project(s):`);
    projectRoots.forEach(root => console.log(`  - ${root}`));

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const root of projectRoots) {
        console.log(`\n📁 Processing: ${root}`);

        for (const target of config.targets) {
            const filePath = join(root, target.path);

            try {
                if (target.type === "markdown") {
                    await updateMarkdownMCPConfig(filePath, config.mcpServers);
                    console.log(`  ✅ Updated ${target.path}`);
                    updated++;
                } else {
                    let configData: any = {};

                    // Read existing config if exists
                    try {
                        configData = await readConfigFile(filePath, target.type);
                    } catch {
                        // File doesn't exist, start fresh
                    }

                    // Merge MCP servers
                    const newConfig = setNestedValue(configData, target.mcpKey, config.mcpServers);

                    // Write back
                    if (!config.dryRun) {
                        await writeConfigFile(filePath, newConfig, target.type);
                    }
                    console.log(`  ✅ Updated ${target.path} ${config.dryRun ? "(dry run)" : ""}`);
                    updated++;
                }
            } catch (error) {
                if ((error as any).code === "ENOENT" && config.skipMissing && target.path !== "AGENTS.md") {
                    // File doesn't exist and it's not AGENTS.md - skip silently
                    skipped++;
                } else {
                    console.error(`  ❌ Error updating ${target.path}:`, (error as Error).message);
                    errors++;
                }
            }
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
}

// CLI entry point
async function main() {
    const args = process.argv.slice(2);
    
    // Parse CLI args
    let configPath: string | undefined;
    let dryRun = false;
    let searchRoot: string | undefined;
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--config" || args[i] === "-c") {
            configPath = args[++i];
        } else if (args[i] === "--dry-run" || args[i] === "-d") {
            dryRun = true;
        } else if (args[i] === "--root" || args[i] === "-r") {
            searchRoot = args[++i];
        } else if (args[i] === "--help" || args[i] === "-h") {
            console.log(`
Usage: mcp-sync [options]

Options:
  -c, --config <path>    Path to config file (default: auto-detect)
  -d, --dry-run          Show what would be changed without writing
  -r, --root <path>      Root directory to search for projects
  -h, --help             Show this help message

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
  "dryRun": false
}
`);
            process.exit(0);
        }
    }
    
    const config = await loadConfig(configPath);
    
    // Override with CLI args
    if (dryRun) config.dryRun = true;
    if (searchRoot) config.searchRoot = searchRoot;
    
    if (Object.keys(config.mcpServers).length === 0) {
        console.error("❌ No MCP servers configured. Please provide a config file or use --config.");
        process.exit(1);
    }
    
    await syncMCPConfigs(config);
}

main().catch(console.error);