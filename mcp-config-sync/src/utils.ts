import fsExtra from "fs-extra";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";
import { parse as parseYAML, stringify as stringifyYAML } from "yaml";
import { MCPServerConfig, TargetConfig } from "./types.js";

const { readFile, writeFile, pathExists, ensureDir } = fsExtra;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..", "..");

export async function findProjectRoots(searchRoot: string, additionalRoots: string[] = []): Promise<string[]> {
  const roots = new Set<string>();
  
  // Find all package.json files (indicates project root)
  const packageJsons = await glob("**/package.json", { 
    cwd: searchRoot,
    ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/.output/**"]
  });
  
  for (const pkg of packageJsons) {
    roots.add(dirname(resolve(searchRoot, pkg)));
  }
  
  // Add additional roots
  for (const root of additionalRoots) {
    roots.add(resolve(root));
  }
  
  // Also add current project
  roots.add(PROJECT_ROOT);
  
  return Array.from(roots);
}

export async function readConfigFile(filePath: string, type: string): Promise<any> {
  const content = await readFile(filePath, "utf-8");
  
  switch (type) {
    case "json":
      return JSON.parse(content);
    case "yaml":
      return parseYAML(content);
    case "toml":
      // Simple TOML parse for basic cases
      return parseTOML(content);
    default:
      return content;
  }
}

export async function writeConfigFile(filePath: string, data: any, type: string): Promise<void> {
  await ensureDir(dirname(filePath));
  
  let content: string;
  switch (type) {
    case "json":
      content = JSON.stringify(data, null, 2);
      break;
    case "yaml":
      content = stringifyYAML(data);
      break;
    case "toml":
      content = stringifyTOML(data);
      break;
    default:
      content = String(data);
  }
  
  await writeFile(filePath, content, "utf-8");
}

function parseTOML(content: string): any {
  const result: any = {};
  let currentSection = result;
  let sectionPath: string[] = [];
  
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    
    const sectionMatch = trimmed.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      sectionPath = sectionMatch[1].split(".");
      currentSection = result;
      for (const part of sectionPath) {
        if (!currentSection[part]) currentSection[part] = {};
        currentSection = currentSection[part];
      }
      continue;
    }
    
    const kvMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
    if (kvMatch) {
      let value: any = kvMatch[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value === "true") {
        value = true;
      } else if (value === "false") {
        value = false;
      } else if (!isNaN(Number(value))) {
        value = Number(value);
      }
      currentSection[kvMatch[1]] = value;
    }
  }
  
  return result;
}

function stringifyTOML(obj: any, prefix = ""): string {
  let result = "";
  const tables: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === "object" && !Array.isArray(value)) {
      tables.push(`[${fullKey}]`);
      tables.push(stringifyTOML(value, fullKey));
    } else {
      let valStr: string;
      if (typeof value === "string") {
        valStr = `"${value}"`;
      } else if (typeof value === "boolean") {
        valStr = value ? "true" : "false";
      } else {
        valStr = String(value);
      }
      result += `${key} = ${valStr}\n`;
    }
  }
  
  return result + tables.join("\n");
}

export function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object") {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

export function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split(".");
  const result = { ...obj };
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = { ...current[key] };
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
}

export async function updateMarkdownMCPConfig(filePath: string, mcpServers: Record<string, any>): Promise<void> {
  let content = "";
  if (await pathExists(filePath)) {
    content = await readFile(filePath, "utf-8");
  }
  
  const mcpConfigJson = JSON.stringify({ mcpServers }, null, 2);
  const mcpBlock = `\n## MCP Servers\n\n\`\`\`json\n${mcpConfigJson}\n\`\`\`\n`;
  
  // Check if MCP Servers section already exists
  if (content.includes("## MCP Servers")) {
    // Replace existing section
    content = content.replace(
      /## MCP Servers\n\n```json\n[\s\S]*?\n```/,
      `## MCP Servers\n\n\`\`\`json\n${mcpConfigJson}\n\`\`\``
    );
  } else {
    // Append to end
    content = content.trimEnd() + mcpBlock;
  }
  
  await writeFile(filePath, content, "utf-8");
}