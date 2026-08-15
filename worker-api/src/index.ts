import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'zingo-api' }));

// Phrase schemas
const PhraseSchema = z.object({
  text: z.string().min(1).max(500),
  weight: z.number().int().min(1).max(10).default(1),
  category: z.enum(['propaganda', 'meme', 'creepy', 'standard']),
  lang: z.string().default('ru'),
  variants: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const PhraseQuerySchema = z.object({
  category: z.enum(['propaganda', 'meme', 'creepy', 'standard']).optional(),
  lang: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// GET /api/v1/phrases - List phrases
app.get('/api/v1/phrases', zValidator('query', PhraseQuerySchema), async (c) => {
  const { category, lang, limit, offset } = c.req.valid('query');
  const db = c.env.DB;
  
  let query = 'SELECT * FROM phrases WHERE deleted_at IS NULL';
  const params: any[] = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (lang) {
    query += ' AND lang = ?';
    params.push(lang);
  }
  
  query += ' ORDER BY category, weight DESC, text LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const { results } = await db.prepare(query).bind(...params).all();
  return c.json({ phrases: results });
});

// GET /api/v1/phrases/:id - Get single phrase
app.get('/api/v1/phrases/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;
  
  const phrase = await db.prepare('SELECT * FROM phrases WHERE id = ? AND deleted_at IS NULL')
    .bind(id).first();
  
  if (!phrase) {
    return c.json({ error: 'Phrase not found' }, 404);
  }
  
  return c.json({ phrase });
});

// POST /api/v1/phrases - Create phrase (admin)
app.post('/api/v1/phrases', zValidator('json', PhraseSchema), async (c) => {
  const phrase = c.req.valid('json');
  const db = c.env.DB;
  
  const variantsJson = phrase.variants ? JSON.stringify(phrase.variants) : null;
  const tagsJson = phrase.tags ? JSON.stringify(phrase.tags) : null;
  
  try {
    const result = await db.prepare(
      `INSERT INTO phrases (text, weight, category, lang, variants, tags)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).bind(phrase.text, phrase.weight, phrase.category, phrase.lang, variantsJson, tagsJson).first();
    
    return c.json({ phrase: result }, 201);
  } catch (e) {
    if (e instanceof Error && e.message.includes('UNIQUE')) {
      return c.json({ error: 'Phrase already exists' }, 409);
    }
    throw e;
  }
});

// PUT /api/v1/phrases/:id - Update phrase (admin)
app.put('/api/v1/phrases/:id', zValidator('json', PhraseSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const updates = c.req.valid('json');
  const db = c.env.DB;
  
  const fields: string[] = [];
  const params: any[] = [];
  
  if (updates.text !== undefined) { fields.push('text = ?'); params.push(updates.text); }
  if (updates.weight !== undefined) { fields.push('weight = ?'); params.push(updates.weight); }
  if (updates.category !== undefined) { fields.push('category = ?'); params.push(updates.category); }
  if (updates.lang !== undefined) { fields.push('lang = ?'); params.push(updates.lang); }
  if (updates.variants !== undefined) { fields.push('variants = ?'); params.push(JSON.stringify(updates.variants)); }
  if (updates.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(updates.tags)); }
  
  if (fields.length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }
  
  fields.push('updated_at = datetime(\'now\')');
  params.push(id);
  
  const result = await db.prepare(
    `UPDATE phrases SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL RETURNING *`
  ).bind(...params).first();
  
  if (!result) {
    return c.json({ error: 'Phrase not found' }, 404);
  }
  
  return c.json({ phrase: result });
});

// DELETE /api/v1/phrases/:id - Soft delete phrase (admin)
app.delete('/api/v1/phrases/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;
  
  const result = await db.prepare(
    `UPDATE phrases SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL RETURNING id`
  ).bind(id).first();
  
  if (!result) {
    return c.json({ error: 'Phrase not found' }, 404);
  }
  
  return c.json({ success: true });
});

// POST /api/v1/events - Ingest event
const EventSchema = z.object({
  phrase_id: z.number().int().positive(),
  category: z.string(),
  platform: z.string(),
  anon_hash: z.string(),
  user_id: z.number().int().positive().optional(),
});

app.post('/api/v1/events', zValidator('json', EventSchema), async (c) => {
  const event = c.req.valid('json');
  const db = c.env.DB;
  
  await db.prepare(
    `INSERT INTO events (phrase_id, category, platform, anon_hash, user_id)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(event.phrase_id, event.category, event.platform, event.anon_hash, event.user_id || null).run();
  
  return c.json({ success: true });
});

// GET /api/v1/analytics/top - Top phrases
app.get('/api/v1/analytics/top', async (c) => {
  const period = c.req.query('period') || 'week';
  const limit = parseInt(c.req.query('limit') || '10');
  const db = c.env.DB;
  
  const days = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 7;
  
  const { results } = await db.prepare(`
    SELECT p.text, p.category, p.weight, SUM(dps.count) as total_count, SUM(dps.unique_users) as total_users
    FROM daily_phrase_stats dps
    JOIN phrases p ON p.id = dps.phrase_id
    WHERE dps.date >= date('now', ?)
    GROUP BY p.id, p.text, p.category, p.weight
    ORDER BY total_count DESC
    LIMIT ?
  `).bind(`-${days} days`, limit).all();
  
  return c.json({ top: results });
});

// GET /api/v1/analytics/categories - Category stats
app.get('/api/v1/analytics/categories', async (c) => {
  const period = c.req.query('period') || 'week';
  const db = c.env.DB;
  
  const days = period === 'day' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 7;
  
  const { results } = await db.prepare(`
    SELECT p.category, SUM(dps.count) as total_count, SUM(dps.unique_users) as total_users
    FROM daily_phrase_stats dps
    JOIN phrases p ON p.id = dps.phrase_id
    WHERE dps.date >= date('now', ?)
    GROUP BY p.category
    ORDER BY total_count DESC
  `).bind(`-${days} days`).all();
  
  return c.json({ categories: results });
});

// WebSocket for leaderboard (simplified - would need Durable Objects for real implementation)
app.get('/ws/v1/leaderboard', (c) => {
  return c.text('WebSocket endpoint - implement with Durable Objects for real-time', 501);
});

// ============================================
// MODERATION WORKFLOW
// ============================================

// Moderation schemas
const ModerationRequestSchema = z.object({
  text: z.string().min(1).max(500),
  lang: z.string().default('ru'),
});

const ModerationEvaluationSchema = z.object({
  approved: z.boolean(),
  category: z.enum(['propaganda', 'meme', 'creepy', 'standard']),
  weight: z.number().int().min(1).max(10),
  reasoning: z.string(),
  suggested_variants: z.array(z.string()).optional(),
});

const ModerationSubmitSchema = z.object({
  text: z.string().min(1).max(500),
  lang: z.string().default('ru'),
  category: z.enum(['propaganda', 'meme', 'creepy', 'standard']),
  weight: z.number().int().min(1).max(10),
  variants: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  moderator_note: z.string().optional(),
});

// POST /api/v1/moderation/evaluate - AI evaluates a phrase
app.post('/api/v1/moderation/evaluate', zValidator('json', ModerationRequestSchema), async (c) => {
  const { text, lang } = c.req.valid('json');
  const db = c.env.DB;
  
  // Check if phrase already exists
  const existing = await db.prepare(
    'SELECT * FROM phrases WHERE text = ? AND deleted_at IS NULL'
  ).bind(text.toLowerCase()).first();
  
  if (existing) {
    return c.json({ 
      exists: true, 
      phrase: existing,
      message: 'Phrase already in database' 
    });
  }
  
  // AI Evaluation prompt (in production, call your LLM here)
  // For now, return a structured evaluation that the frontend/MCP can use
  const evaluation = await evaluatePhraseWithAI(text, lang);
  
  return c.json({
    exists: false,
    evaluation,
    text,
    lang,
  });
});

// POST /api/v1/moderation/approve - Approve and add phrase
app.post('/api/v1/moderation/approve', zValidator('json', ModerationSubmitSchema), async (c) => {
  const data = c.req.valid('json');
  const db = c.env.DB;
  
  const variantsJson = data.variants ? JSON.stringify(data.variants) : null;
  const tagsJson = data.tags ? JSON.stringify(data.tags) : null;
  
  try {
    const result = await db.prepare(
      `INSERT INTO phrases (text, weight, category, lang, variants, tags)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).bind(
      data.text.toLowerCase(),
      data.weight,
      data.category,
      data.lang,
      variantsJson,
      tagsJson
    ).first();
    
    // Log moderation action
    await db.prepare(
      `INSERT INTO moderation_log (phrase_id, action, moderator_note, created_at)
       VALUES (?, 'approved', ?, datetime('now'))`
    ).bind(result.id, data.moderator_note || 'Approved via moderation workflow').run();
    
    return c.json({ phrase: result, success: true }, 201);
  } catch (e) {
    if (e instanceof Error && e.message.includes('UNIQUE')) {
      return c.json({ error: 'Phrase already exists' }, 409);
    }
    throw e;
  }
});

// POST /api/v1/moderation/reject - Reject phrase
app.post('/api/v1/moderation/reject', zValidator('json', z.object({
  text: z.string(),
  reason: z.string(),
})), async (c) => {
  const { text, reason } = c.req.valid('json');
  const db = c.env.DB;
  
  // Log rejection
  await db.prepare(
    `INSERT INTO moderation_log (phrase_text, action, moderator_note, created_at)
     VALUES (?, 'rejected', ?, datetime('now'))`
  ).bind(text.toLowerCase(), reason).run();
  
  return c.json({ success: true, message: 'Phrase rejected and logged' });
});

// GET /api/v1/moderation/log - Get moderation history
app.get('/api/v1/moderation/log', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const db = c.env.DB;
  
  const { results } = await db.prepare(`
    SELECT * FROM moderation_log 
    ORDER BY created_at DESC 
    LIMIT ?
  `).bind(limit).all();
  
  return c.json({ log: results });
});

// AI Evaluation Function (replace with actual LLM call in production)
async function evaluatePhraseWithAI(text: string, lang: string) {
  const normalizedText = text.toLowerCase().trim();
  
  // Simple heuristic evaluation (replace with actual AI call)
  let category: 'propaganda' | 'meme' | 'creepy' | 'standard' = 'standard';
  let weight = 3;
  let reasoning = '';
  let approved = true;
  
  // Propaganda keywords
  const propagandaKeywords = ['братські', 'спеціальна', 'війна', 'нацист', 'денацифікація', 'рф', 'путін', 'кременль', 'зсу', 'ато', 'оборона'];
  // Creepy keywords  
  const creepyKeywords = ['нюдс', 'фоточки', 'одна', 'симпатич', 'адрес', 'жив', 'вік', 'років', 'друг навечно'];
  // Meme keywords
  const memeKeywords = ['газ', 'мова', 'друзі', 'поговорим'];
  
  const lowerText = normalizedText;
  
  if (propagandaKeywords.some(k => lowerText.includes(k))) {
    category = 'propaganda';
    weight = 7;
    reasoning = 'Contains propaganda-related keywords';
  } else if (creepyKeywords.some(k => lowerText.includes(k))) {
    category = 'creepy';
    weight = 8;
    reasoning = 'Contains creepy/inappropriate keywords';
  } else if (memeKeywords.some(k => lowerText.includes(k))) {
    category = 'meme';
    weight = 5;
    reasoning = 'Contains meme-related keywords';
  } else {
    category = 'standard';
    weight = 2;
    reasoning = 'Standard conversational phrase';
  }
  
  // Generate variants
  const variants = generateVariants(normalizedText);
  
  return {
    approved,
    category,
    weight,
    reasoning,
    suggested_variants: variants,
  };
}

function generateVariants(text: string): string[] {
  const variants = new Set<string>();
  variants.add(text);
  
  // Add common variations
  const noPunctuation = text.replace(/[.,!?;:]/g, '');
  variants.add(noPunctuation);
  
  // Add with different spacing
  variants.add(text.replace(/\s+/g, ' ').trim());
  
  // Add common typos/transliterations for Russian/Ukrainian
  const translit = text
    .replace(/і/gi, 'i')
    .replace(/ї/gi, 'yi')
    .replace(/є/gi, 'ye')
    .replace(/ґ/gi, 'g')
    .replace(/х/gi, 'h')
    .replace(/щ/gi, 'shch')
    .replace(/ю/gi, 'yu')
    .replace(/я/gi, 'ya');
  if (translit !== text) variants.add(translit);
  
  return Array.from(variants).slice(0, 10);
}

// Create moderation_log table if not exists (run once)
app.post('/api/v1/admin/init-moderation', async (c) => {
  const db = c.env.DB;
  
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS moderation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now')),
      phrase_id INTEGER,
      phrase_text TEXT,
      action TEXT NOT NULL, -- 'approved' | 'rejected'
      moderator_note TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_moderation_phrase ON moderation_log(phrase_id);
    CREATE INDEX IF NOT EXISTS idx_moderation_action ON moderation_log(action);
  `).run();
  
  return c.json({ success: true, message: 'Moderation tables created' });
});

export default app;