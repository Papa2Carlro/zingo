# mcp-config-sync

A CLI tool to sync MCP (Model Context Protocol) server configurations across multiple IDE/editor config files.

## Features

- Sync MCP servers to multiple config formats (JSON, YAML, TOML, Markdown)
- Auto-discovers project roots via `package.json`
- Configurable via config file or CLI arguments
- Dry-run mode to preview changes
- Supports VS Code, Cursor, Copilot, and generic configs

## Installation

```bash
npm install -g mcp-config-sync
# or
npx mcp-config-sync
```

## Quick Start

1. Create a config file `mcp-sync.config.json` in your project root:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": { "API_KEY": "your-key" }
    }
  }
}
```

2. Run the sync:

```bash
mcp-sync
```

## Configuration

### Config File (`mcp-sync.config.json`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mcpServers` | `Record<string, MCPServerConfig>` | **Required** | MCP servers to sync |
| `targets` | `TargetConfig[]` | See below | Target config files to update |
| `searchRoot` | `string` | `process.cwd()` | Root directory to search for projects |
| `additionalRoots` | `string[]` | `[]` | Additional project roots to include |
| `skipMissing` | `boolean` | `true` | Skip files that don't exist |
| `dryRun` | `boolean` | `false` | Preview changes without writing |

### Default Targets

```json
[
  { "path": ".vscode/mcp.json", "type": "json", "mcpKey": "mcpServers" },
  { "path": ".vscode/settings.json", "type": "json", "mcpKey": "mcp.servers" },
  { "path": ".cursor/mcp.json", "type": "json", "mcpKey": "mcpServers" },
  { "path": ".copilot/mcp-config.json", "type": "json", "mcpKey": "mcpServers" },
  { "path": "mcp.json", "type": "json", "mcpKey": "mcpServers" },
  { "path": ".mcp.json", "type": "json", "mcpKey": "mcpServers" },
  { "path": "AGENTS.md", "type": "markdown", "mcpKey": "mcpServers" }
]
```

### MCPServerConfig

```typescript
interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}
```

### TargetConfig

```typescript
interface TargetConfig {
  path: string;           // Relative path from project root
  type: 'json' | 'yaml' | 'toml' | 'markdown';
  mcpKey: string;         // Nested key path (e.g., "mcpServers" or "mcp.servers")
}
```

## CLI Options

```bash
mcp-sync [options]

Options:
  -c, --config <path>    Path to config file (default: auto-detect)
  -d, --dry-run          Show what would be changed without writing
  -r, --root <path>      Root directory to search for projects
  -h, --help             Show this help message
```

## Examples

### Sync to specific directory

```bash
mcp-sync --root /path/to/projects
```

### Dry run to preview changes

```bash
mcp-sync --dry-run
```

### Use custom config file

```bash
mcp-sync --config ./my-mcp-config.json
```

### Add multiple servers

```json
{
  "mcpServers": {
    "server-1": {
      "command": "node",
      "args": ["/path/to/server1.js"]
    },
    "server-2": {
      "command": "python",
      "args": ["-m", "my_mcp_server"],
      "env": { "API_KEY": "secret" }
    }
  }
}
```

## How It Works

1. **Discovers projects** - Finds all directories containing `package.json` under `searchRoot`
2. **Reads existing configs** - For each project, reads target config files
3. **Merges MCP servers** - Deep merges the configured MCP servers into each target
4. **Writes back** - Updates the config files (or shows preview in dry-run mode)

## Supported Config Formats

- **JSON** - `.vscode/mcp.json`, `.cursor/mcp.json`, `mcp.json`, etc.
- **YAML** - `.yaml`, `.yml` files
- **TOML** - `.toml` files (basic support)
- **Markdown** - `AGENTS.md` (adds/updates a `## MCP Servers` section with JSON code block)

## License

MIT