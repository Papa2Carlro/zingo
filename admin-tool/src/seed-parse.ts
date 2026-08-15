import 'dotenv/config';
import { Pool } from 'pg';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const PhraseSchema = z.object({
  text: z.string(),
  weight: z.number().int().min(1).max(10),
  category: z.enum(['propaganda', 'meme', 'creepy', 'standard']),
  lang: z.string().default('ru'),
  variants: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

type Phrase = z.infer<typeof PhraseSchema>;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function parsePhrasesFromMarkdown(): Promise<Phrase[]> {
  const content = readFileSync(join(__dirname, '..', 'docs', 'PHRASES.md'), 'utf-8');
  const phrases: Phrase[] = [];
  
  let currentCategory = '';
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for category headers
    if (trimmed.startsWith('## ')) {
      currentCategory = trimmed.slice(3).toLowerCase();
      continue;
    }
    
    // Parse phrase lines: "- phrase text - weight X"
    const match = trimmed.match(/^-\s+(.+?)\s+-\s+weight\s+(\d+)$/i);
    if (match && currentCategory) {
      const [, text, weightStr] = match;
      const weight = parseInt(weightStr, 10);
      
      // Normalize text (lowercase, remove punctuation)
      const normalizedText = text.toLowerCase().replace(/[.,!?;:]/g, '').trim();
      
      phrases.push({
        text: normalizedText,
        weight,
        category: currentCategory as Phrase['category'],
        lang: 'ru',
      });
    }
  }
  
  return phrases;
}

async function seedPhrases(phrases: Phrase[]) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create table if not exists (matching Go model)
    await client.query(`
      CREATE TABLE IF NOT EXISTS phrases (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE,
        text VARCHAR NOT NULL UNIQUE,
        variants TEXT,
        weight INT NOT NULL DEFAULT 1,
        category VARCHAR NOT NULL,
        lang VARCHAR NOT NULL DEFAULT 'ru',
        tags TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_phrase_category ON phrases(category);
      CREATE INDEX IF NOT EXISTS idx_phrase_text ON phrases(text);
    `);
    
    let inserted = 0;
    let skipped = 0;
    
    for (const phrase of phrases) {
      const variantsJson = phrase.variants ? JSON.stringify(phrase.variants) : null;
      const tagsJson = phrase.tags ? JSON.stringify(phrase.tags) : null;
      
      try {
        await client.query(
          `INSERT INTO phrases (text, weight, category, lang, variants, tags)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (text) DO UPDATE SET
             weight = EXCLUDED.weight,
             category = EXCLUDED.category,
             lang = EXCLUDED.lang,
             variants = EXCLUDED.variants,
             tags = EXCLUDED.tags,
             updated_at = NOW()`,
          [phrase.text, phrase.weight, phrase.category, phrase.lang, variantsJson, tagsJson]
        );
        inserted++;
      } catch (e) {
        skipped++;
      }
    }
    
    await client.query('COMMIT');
    console.log(`✅ Seeded: ${inserted} phrases inserted/updated, ${skipped} skipped`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🌱 ZINGO Phrase Seeder');
  console.log('========================');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('Example: DATABASE_URL=postgresql://user:pass@host:5432/dbname');
    process.exit(1);
  }
  
  try {
    const phrases = await parsePhrasesFromMarkdown();
    console.log(`📝 Parsed ${phrases.length} phrases from PHRASES.md`);
    
    // Show preview
    console.log('\n📋 Preview:');
    phrases.slice(0, 5).forEach(p => {
      console.log(`  [${p.category}] "${p.text}" (weight: ${p.weight})`);
    });
    if (phrases.length > 5) console.log(`  ... and ${phrases.length - 5} more`);
    
    await seedPhrases(phrases);
    console.log('\n🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();