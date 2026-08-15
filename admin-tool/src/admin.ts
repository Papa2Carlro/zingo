import 'dotenv/config';
import { Pool } from 'pg';
import { z } from 'zod';
import readline from 'readline/promises';
import { stdin, stdout } from 'process';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const PhraseSchema = z.object({
  text: z.string(),
  weight: z.number().int().min(1).max(10),
  category: z.enum(['propaganda', 'meme', 'creepy', 'standard']),
  lang: z.string().default('ru'),
  variants: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

async function listPhrases(category?: string) {
  const client = await pool.connect();
  try {
    let query = 'SELECT * FROM phrases WHERE deleted_at IS NULL';
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY category, weight DESC, text';
    
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

async function addPhrase(phrase: z.infer<typeof PhraseSchema>) {
  const client = await pool.connect();
  try {
    const variantsJson = phrase.variants ? JSON.stringify(phrase.variants) : null;
    const tagsJson = phrase.tags ? JSON.stringify(phrase.tags) : null;
    
    const result = await client.query(
      `INSERT INTO phrases (text, weight, category, lang, variants, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (text) DO UPDATE SET
         weight = EXCLUDED.weight,
         category = EXCLUDED.category,
         lang = EXCLUDED.lang,
         variants = EXCLUDED.variants,
         tags = EXCLUDED.tags,
         updated_at = NOW()
       RETURNING *`,
      [phrase.text, phrase.weight, phrase.category, phrase.lang, variantsJson, tagsJson]
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function deletePhrase(id: number) {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE phrases SET deleted_at = NOW() WHERE id = $1',
      [id]
    );
  } finally {
    client.release();
  }
}

async function showStats() {
  const client = await pool.connect();
  try {
    const total = await client.query('SELECT COUNT(*) FROM phrases WHERE deleted_at IS NULL');
    const byCategory = await client.query(
      'SELECT category, COUNT(*) as count FROM phrases WHERE deleted_at IS NULL GROUP BY category'
    );
    const byLang = await client.query(
      'SELECT lang, COUNT(*) as count FROM phrases WHERE deleted_at IS NULL GROUP BY lang'
    );
    
    console.log('\n📊 Database Stats:');
    console.log(`  Total phrases: ${total.rows[0].count}`);
    console.log('\n  By category:');
    byCategory.rows.forEach(r => console.log(`    ${r.category}: ${r.count}`));
    console.log('\n  By language:');
    byLang.rows.forEach(r => console.log(`    ${r.lang}: ${r.count}`));
  } finally {
    client.release();
  }
}

async function interactiveMode() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  
  console.log('\n🎮 ZINGO Admin Tool - Interactive Mode');
  console.log('======================================');
  console.log('Commands: list, add, delete, stats, help, exit');
  
  while (true) {
    const input = await rl.question('\n> ');
    const [cmd, ...args] = input.trim().split(/\s+/);
    
    switch (cmd) {
      case 'list': {
        const category = args[0];
        const phrases = await listPhrases(category);
        console.log(`\n📝 Phrases${category ? ` (${category})` : ''}:`);
        phrases.forEach(p => {
          console.log(`  [${p.id}] [${p.category}] "${p.text}" (weight: ${p.weight}, lang: ${p.lang})`);
        });
        break;
      }
      case 'add': {
        const text = await rl.question('Text: ');
        const weight = parseInt(await rl.question('Weight (1-10): '), 10);
        const category = await rl.question('Category (propaganda/meme/creepy/standard): ') as any;
        const lang = await rl.question('Language (ru/uk/en): ') || 'ru';
        
        const phrase = PhraseSchema.parse({ text, weight, category, lang });
        const result = await addPhrase(phrase);
        console.log(`✅ Added: [${result.id}] "${result.text}"`);
        break;
      }
      case 'delete': {
        const id = parseInt(args[0], 10);
        if (isNaN(id)) {
          console.log('Usage: delete <id>');
          break;
        }
        await deletePhrase(id);
        console.log(`✅ Deleted phrase ${id}`);
        break;
      }
      case 'stats':
        await showStats();
        break;
      case 'help':
        console.log('Commands: list [category], add, delete <id>, stats, help, exit');
        break;
      case 'exit':
      case 'quit':
        console.log('👋 Bye!');
        rl.close();
        return;
      default:
        console.log('Unknown command. Type "help" for commands.');
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  try {
    await interactiveMode();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();