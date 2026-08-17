import { createServer } from 'http';
import { readFile, access } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { dirname as dirName, resolve } from 'path';
import { loadConfig, DEFAULT_CONFIG } from './config.js';
import { syncMCPConfigs, SyncResult } from './sync.js';
import { glob } from 'glob';
import { saveConfigs, getAllConfigs, getConfigsCount } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirName(__filename);
const UI_DIR = resolve(__dirname, '..', 'ui');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

async function serveStatic(req, res) {
    let filePath = join(UI_DIR, req.url === '/' ? 'index.html' : req.url);

    // Security: prevent directory traversal
    if (!filePath.startsWith(UI_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return true;
    }

    try {
        const content = await readFile(filePath);
        const ext = extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(content);
        return true;
    } catch (e) {
        if (e.code === 'ENOENT') {
            return false;
        }
        throw e;
    }
}

async function scanAllConfigs() {
    const results: any[] = [];
    const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
    const cwd = process.cwd();

    // Global configs - exact paths
    const globalConfigPaths = [
        join(homeDir, '.vscode', 'mcp.json'),
        join(homeDir, '.cursor', 'mcp.json'),
        join(homeDir, '.copilot', 'mcp-config.json'),
        join(homeDir, 'AGENTS.md'),
        join(homeDir, '.vscode', 'settings.json'),        join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
        join(homeDir, 'Library', 'Application Support', 'Windsurf', 'settings.json'),
        join(homeDir, '.config', 'zed', 'settings.json'),
        join(homeDir, '.config', 'cline', 'settings.json'),
        join(homeDir, '.config', 'roo-code', 'settings.json'),
        join(homeDir, '.continue', 'config.json'),    ];

    // Local project roots - include home directory for broader scan
    const projectRoots = [
        cwd,
        homeDir,
        resolve(homeDir, 'Projects'),
        resolve(homeDir, 'code'),
        resolve(homeDir, 'repos'),
        resolve(homeDir, 'dev'),
        resolve(homeDir, 'Desktop'),
        resolve(homeDir, 'Documents'),
    ].filter(dir => {
        try {
            return require('fs').existsSync(dir);
        } catch {
            return false;
        }
    });

    const localPatterns = [
        '.vscode/mcp.json',
        '.cursor/mcp.json',
        '.copilot/mcp-config.json',
        'mcp.json',
        '.mcp.json',
        'AGENTS.md',
        '.vscode/settings.json',
        '.claude/settings.json',
        '.windsurf/settings.json',
        '.zed/settings.json',
        '.cline/settings.json',
        '.roo-code/settings.json',
        '.continue/config.json',
    ];

    const globOptions = {
        absolute: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.output/**', '**/.next/**', '**/build/**'],
        maxDepth: 4,
        followSymbolicLinks: false,
    };

    // Check global configs
    for (const configPath of globalConfigPaths) {
        try {
            await access(configPath);
            const content = await readFile(configPath, 'utf-8');
            const ext = extname(configPath);
            let parsed;

            if (ext === '.json') {
                try {
                    parsed = JSON.parse(content);
                } catch {
                    parsed = { raw: content };
                }
            } else {
                parsed = { raw: content };
            }

            results.push({
                path: configPath,
                relativePath: configPath.replace(homeDir, '~'),
                type: configPath.includes('.vscode') && ext === '.json' && configPath.includes('settings') ? 'global-vscode-settings' :
                      configPath.includes('.vscode') ? 'global-vscode' :
                      configPath.includes('.cursor') ? 'global-cursor' :
                      configPath.includes('.copilot') ? 'global-copilot' : 'global-agents',
                content: parsed,
                exists: true
            });
        } catch {
            // File doesn't exist, skip
        }
    }

    // Check local project configs
    for (const root of projectRoots) {
        for (const pattern of localPatterns) {
            try {
                const files = await glob(pattern, {
                    ...globOptions,
                    cwd: root,
                });

                for (const filePath of files.slice(0, 20)) {
                    if (filePath.startsWith(homeDir + '/.vscode') ||
                        filePath.startsWith(homeDir + '/.cursor') ||
                        filePath.startsWith(homeDir + '/.copilot')) {
                        continue;
                    }

                    try {
                        const content = await readFile(filePath, 'utf-8');
                        const ext = extname(filePath);
                        let parsed;

                        if (ext === '.json') {
                            try {
                                parsed = JSON.parse(content);
                            } catch {
                                parsed = { raw: content };
                            }
                        } else {
                            parsed = { raw: content };
                        }

                        results.push({
                            path: filePath,
                            relativePath: filePath.replace(cwd, '.').replace(/^\//, ''),
                            type: ext === '.json' ? 'json' : 'markdown',
                            content: parsed,
                            exists: true
                        });
                    } catch (e) {
                        results.push({
                            path: filePath,
                            relativePath: filePath.replace(cwd, '.').replace(/^\//, ''),
                            type: extname(filePath) === '.json' ? 'json' : 'markdown',
                            error: (e as Error).message,
                            exists: false
                        });
                    }
                }

                if (results.length > 100) break;
            } catch {
                // Skip if glob fails
            }
        }
        if (results.length > 100) break;
    }

    return results;
}

async function handleApi(req, res) {
    const url = new URL(req.url, `http://localhost`);

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        if (url.pathname === '/api/config' && req.method === 'GET') {
            const config = await loadConfig();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(config));
            return;
        }

        if (url.pathname === '/api/default-config' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(DEFAULT_CONFIG));
            return;
        }

        if (url.pathname === '/api/scan' && req.method === 'GET') {
            const configs = await scanAllConfigs();
            
            // Save to SQLite
            try {
                saveConfigs(configs.map(c => ({
                    path: c.path,
                    relativePath: c.relativePath,
                    type: c.type,
                    content: c.content,
                    exists: c.exists,
                    error: c.error
                })));
            } catch (e) {
                console.error('Failed to save to SQLite:', e);
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(configs));
            return;
        }
        
        if (url.pathname === '/api/configs' && req.method === 'GET') {
            // Get all saved configs from SQLite
            const savedConfigs = getAllConfigs();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(savedConfigs));
            return;
        }
        
        if (url.pathname === '/api/configs/count' && req.method === 'GET') {
            const count = getConfigsCount();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(count));
            return;
        }

        if (url.pathname === '/api/sync' && req.method === 'POST') {
            let body = '';
            for await (const chunk of req) {
                body += chunk;
            }
            const config = JSON.parse(body);

            try {
                const result: SyncResult = await syncMCPConfigs(config);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    updated: result.updated,
                    skipped: result.skipped,
                    errors: result.errors,
                    logs: result.logs
                }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
            return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
    }
}

const server = createServer(async (req, res) => {
    if (req.url.startsWith('/api/')) {
        await handleApi(req, res);
    } else {
        const served = await serveStatic(req, res);
        if (!served) {
            // SPA fallback
            try {
                const content = await readFile(join(UI_DIR, 'index.html'));
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            } catch {
                res.writeHead(404);
                res.end('Not found');
            }
        }
    }
});

const PORT = process.env.PORT || 3456;
server.listen(PORT, () => {
    console.log(`MCP Config Sync UI running at http://localhost:${PORT}`);
});

export { server };