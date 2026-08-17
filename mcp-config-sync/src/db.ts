import { ensureDirSync } from 'fs-extra';
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'data', 'configs.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!db) {
        ensureDirSync(dirname(DB_PATH));
        
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        
        db.exec(`
            CREATE TABLE IF NOT EXISTS scanned_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT UNIQUE NOT NULL,
                relative_path TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT,
                "exists" INTEGER DEFAULT 1,
                error TEXT,
                scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_scanned_configs_timestamp
            AFTER UPDATE ON scanned_configs
            FOR EACH ROW
            BEGIN
                UPDATE scanned_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `);
    }
    return db;
}

export interface ScannedConfig {
    id?: number;
    path: string;
    relativePath: string;
    type: string;
    content?: any;
    exists: boolean;
    error?: string;
    scannedAt?: string;
    updatedAt?: string;
}

export function saveConfig(config: ScannedConfig): void {
    const db = getDb();
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO scanned_configs (path, relative_path, type, content, "exists", error)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const contentStr = typeof config.content === 'string' 
        ? config.content 
        : JSON.stringify(config.content || null);
    
    stmt.run(
        config.path,
        config.relativePath,
        config.type,
        contentStr,
        config.exists ? 1 : 0,
        config.error || null
    );
}

export function saveConfigs(configs: ScannedConfig[]): void {
    const db = getDb();
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO scanned_configs (path, relative_path, type, content, "exists", error)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = db.transaction(() => {
        for (const config of configs) {
            const contentStr = typeof config.content === 'string' 
                ? config.content 
                : JSON.stringify(config.content || null);
            
            stmt.run(
                config.path,
                config.relativePath,
                config.type,
                contentStr,
                config.exists ? 1 : 0,
                config.error || null
            );
        }
    });
    
    transaction();
}

export function getAllConfigs(): ScannedConfig[] {
    const db = getDb();
    const stmt = db.prepare(`
        SELECT id, path, relative_path as relativePath, type, content, "exists", error, scanned_at as scannedAt, updated_at as updatedAt
        FROM scanned_configs
        ORDER BY scanned_at DESC
    `);
    
    return stmt.all().map((row: any) => ({
        ...row,
        exists: Boolean(row.exists),
        content: row.content ? JSON.parse(row.content) : undefined
    }));
}

export function getConfigByPath(path: string): ScannedConfig | undefined {
    const db = getDb();
    const stmt = db.prepare(`
        SELECT id, path, relative_path as relativePath, type, content, exists, error, scanned_at as scannedAt, updated_at as updatedAt
        FROM scanned_configs
        WHERE path = ?
    `);
    
    const row = stmt.get(path) as any;
    if (!row) return undefined;
    
    return {
        ...row,
        exists: Boolean(row.exists),
        content: row.content ? JSON.parse(row.content) : undefined
    };
}

export function deleteConfig(id: number): void {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM scanned_configs WHERE id = ?');
    stmt.run(id);
}

export function clearAllConfigs(): void {
    const db = getDb();
    db.exec('DELETE FROM scanned_configs');
}

export function getConfigsCount(): { total: number; valid: number; invalid: number } {
    const db = getDb();
    const total = db.prepare('SELECT COUNT(*) as count FROM scanned_configs').get().count as number;
    const valid = db.prepare('SELECT COUNT(*) as count FROM scanned_configs WHERE "exists" = 1 AND error IS NULL').get().count as number;
    const invalid = total - valid;
    
    return { total, valid, invalid };
}