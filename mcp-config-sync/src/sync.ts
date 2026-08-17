import { findProjectRoots, readConfigFile, writeConfigFile, updateMarkdownMCPConfig, deepMerge, setNestedValue, readGlobalConfig, writeGlobalConfig } from "./utils.js";
import { SyncConfig, GLOBAL_CONFIG_LOCATIONS } from "./config.js";
import { join } from "path";

export interface SyncResult {
    updated: number;
    skipped: number;
    errors: number;
    logs: string[];
    globalUpdated: number;
    projectUpdated: number;
}

export async function syncMCPConfigs(config: SyncConfig): Promise<SyncResult> {
    const logs: string[] = [];
    
    const log = (...args: any[]) => logs.push(args.join(' '));
    const error = (...args: any[]) => logs.push('ERROR: ' + args.join(' '));
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let globalUpdated = 0;
    let projectUpdated = 0;

    // Sync global configs first
    if (config.includeGlobal) {
        log("🌍 Syncing global/user-level configs...");
        for (const globalLoc of GLOBAL_CONFIG_LOCATIONS) {
            try {
                await syncGlobalConfig(globalLoc, config.mcpServers, config.dryRun, log, error);
                globalUpdated++;
                log(`  ✅ Updated global: ${globalLoc.name}`);
            } catch (err) {
                if ((err as any).code === "ENOENT" && config.skipMissing) {
                    skipped++;
                    log(`  ⏭️  Skipped global (not found): ${globalLoc.name}`);
                } else {
                    error(`  ❌ Error updating global ${globalLoc.name}:`, (err as Error).message);
                    errors++;
                }
            }
        }
    }

    // Sync project configs
    if (!config.globalOnly) {
        log("🔍 Finding project roots...");
        const projectRoots = await findProjectRoots(config.searchRoot || process.cwd(), config.additionalRoots);
        log(`Found ${projectRoots.length} project(s)`);

        for (const root of projectRoots) {
            log(`\n📁 Processing: ${root}`);

            for (const target of config.targets) {
                // Skip global targets in project sync
                if (target.scope === "global") continue;
                
                const filePath = join(root, target.path);

                try {
                    if (target.type === "markdown") {
                        await updateMarkdownMCPConfig(filePath, config.mcpServers);
                        log(`  ✅ Updated ${target.path}`);
                        projectUpdated++;
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
                        log(`  ✅ Updated ${target.path} ${config.dryRun ? "(dry run)" : ""}`);
                        projectUpdated++;
                        updated++;
                    }
                } catch (err) {
                    if ((err as any).code === "ENOENT" && config.skipMissing && target.path !== "AGENTS.md") {
                        // File doesn't exist and it's not AGENTS.md - skip silently
                        skipped++;
                    } else {
                        error(`  ❌ Error updating ${target.path}:`, (err as Error).message);
                        errors++;
                    }
                }
            }
        }
    }

    log(`\n📊 Summary:`);
    log(`  🌍 Global updated: ${globalUpdated}`);
    log(`  📁 Project updated: ${projectUpdated}`);
    log(`  ✅ Total updated: ${globalUpdated + projectUpdated}`);
    log(`  ⏭️  Skipped: ${skipped}`);
    log(`  ❌ Errors: ${errors}`);

    return { updated: globalUpdated + projectUpdated, skipped, errors, logs, globalUpdated, projectUpdated };
}

async function syncGlobalConfig(
    globalLoc: any, 
    mcpServers: Record<string, any>, 
    dryRun: boolean,
    log: Function,
    error: Function
): Promise<void> {
    const { pathExists } = await import("fs-extra");
    
    if (!(await pathExists(globalLoc.path))) {
        throw { code: "ENOENT", message: "File not found" };
    }

    let configData: any = {};
    
    // Read existing config
    try {
        configData = await readConfigFile(globalLoc.path, globalLoc.type);
    } catch {
        // File doesn't exist or can't parse, start fresh
    }

    // Transform servers based on format
    const transformedServers = transformServersForFormat(mcpServers, globalLoc.format || "standard");

    // Merge MCP servers
    const newConfig = setNestedValue(configData, globalLoc.mcpKey, transformedServers);

    // Write back
    if (!dryRun) {
        await writeGlobalConfig(globalLoc.path, newConfig, globalLoc.type, globalLoc.format);
    }
}

function transformServersForFormat(servers: Record<string, any>, format: string): any {
    switch (format) {
        case "vscode":
            // VS Code uses "servers" key with type field
            const result: any = {};
            for (const [name, server] of Object.entries(servers)) {
                const s = server as any;
                result[name] = {
                    command: s.command,
                    args: s.args,
                    env: s.env,
                    url: s.url,
                    type: s.type || (s.url ? "http" : "stdio"),
                    headers: s.headers,
                };
            }
            return result;
            
        case "codex":
            // Codex uses TOML with [mcp_servers.name] format
            // The config structure is different - we return the servers as-is
            // and the TOML writer will handle the format
            return servers;
            
        case "claude":
            // Claude Desktop uses standard mcpServers format
            return servers;
            
        default:
            return servers;
    }
}