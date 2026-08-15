import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running migrations...');
    
    // Read migration files
    const migrationsDir = join(__dirname, '..', 'backend', 'migrations');
    const upMigrations = ['001_init.up.sql', '002_refresh_stats.up.sql'];
    
    for (const migration of upMigrations) {
      const sql = readFileSync(join(migrationsDir, migration), 'utf-8');
      console.log(`  Running ${migration}...`);
      await client.query(sql);
    }
    
    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🗄️  ZINGO Database Setup');
  console.log('=========================');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  try {
    await runMigrations();
    console.log('\n🎉 Database ready!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();