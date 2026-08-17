/* bingo-generator package - Card generation logic */
export interface Phrase {
  id: string;
  text: string;
  variants?: string[];
  weight: number;
  category: string;
  lang: string;
  tags?: string[];
  hits: number;
  syncedAt: number;
}

export interface BingoCard {
  id: string;
  name: string;
  size: { x: number; y: number };
  phrases: string[]; // IDs of selected phrases
  isPreset: boolean;
  createdAt: number;
}

export interface GeneratorOptions {
  size?: { x: number; y: number };
  presetPhraseIds?: string[];
}

/**
 * Generate weighted random selection of phrase IDs
 * Higher weight = higher probability of selection
 * @param phrases - Array of phrases with weight property
 * @param count - Number of phrases to select (default: 25 for 5x5)
 * @returns - Selected phrase IDs
 */
export function generateWeighted(phrases: Phrase[], count?: number): string[] {
  if (!phrases || phrases.length === 0) return [];
  const total = count || 25; // default 5x5 = 25
  if (phrases.length < count) {
    console.warn(`Not enough phrases: have ${phrases.length}, need ${count}`);
    return phrases.map(p => p.id);
  }

  // Weighted random: Math.random ** (1/weight)
  // Higher weight -> higher probability (closer to 1)
  const weighted = phrases
    .map(p => ({ phrase: p, score: Math.random ** (1 / Math.max(1, p.weight)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, total)
    .map(x => x.phrase.id);

  return weighted;
}

/**
 * Generate a complete BingoCard with weighted selection
 * @param phrases - Array of available phrases
 * @param options - Size and optional preset
 * @returns - Complete BingoCard object
 */
export function generateCard(
  phrases: Phrase[],
  options: GeneratorOptions = {}
): BingoCard {
  const { size = { x: 5, y: 5 }, presetPhraseIds } = options;
  const totalCells = size.x * size.y;

  let phraseIds: string[];
  if (presetPhraseIds) {
    // Use preset IDs, filter to available phrases
    phraseIds = presetPhraseIds.filter(id => 
      phrases.some(p => p.id === id)
    );
    if (phraseIds.length < totalCells) {
      // Fallback to weighted generation
      const available = phrases.filter(p => !phraseIds.includes(p.id));
      const additional = generateWeighted(available, totalCells - phraseIds.length);
      phraseIds = [...phraseIds, ...additional];
    }
  } else {
    // Full weighted random generation
    phraseIds = generateWeighted(phrases, totalCells);
  }

  return {
    id: crypto.randomUUID(),
    name: 'Auto-generated',
    size,
    phrases: phraseIds,
    isPreset: !!presetPhraseIds,
    createdAt: Date.now(),
  };
}

/**
 * Check if a bingo line is completed
 * @param card - The BingoCard
 * @param marked - Record of marked phrase IDs and their order
 * @returns - Array of completed line descriptions
 */
export function checkBingo(
  card: BingoCard,
  marked: Record<string, number>
): string[] {
  const { size } = card;
  const { x: width, y: height } = size;
  const totalCells = width * height;
  const lines: string[] = [];

  // Rows
  for (let r = 0; r < height; r++) {
    const row = [];
    for (let c = 0; c < width; c++) {
      const idx = r * width + c;
      if (marked[card.phrases[idx]]) row.push(card.phrases[idx]);
    }
    if (row.length === width) lines.push(`row-${r}`);
  }

  // Columns
  for (let c = 0; c < width; c++) {
    const col = [];
    for (let r = 0; r < height; r++) {
      const idx = r * width + c;
      if (marked[card.phrases[idx]]) col.push(card.phrases[idx]);
    }
    if (col.length === height) lines.push(`col-${c}`);
  }

  // Diagonals (only for square cards)
  if (width === height) {
    const diag1 = [];
    const diag2 = [];
    for (let i = 0; i < width; i++) {
      const idx1 = i * width + i;
      const idx2 = i * width + (width - 1 - i);
      if (marked[card.phrases[idx1]]) diag1.push(card.phrases[idx1]);
      if (marked[card.phrases[idx2]]) diag2.push(card.phrases[idx2]);
    }
    if (diag1.length === width) lines.push('diag-main');
    if (diag2.length === width) lines.push('diag-anti');
  }

  return lines;
}

/**
 * Default set of propaganda phrases (UKR) - can be overridden
 * @returns - Array of Phrase objects with weights
 */
export const defaultPhrases: Phrase[] = [
  { id: 'prop1', text: 'братськінароди', weight: 9, category: 'propaganda', lang: 'uk', hits: 0, syncedAt: 0 },
  { id: 'prop2', text: 'спецоперація', weight: 10, category: 'propaganda', lang: 'uk', hits: 0, syncedAt: 0 },
  { id: 'prop3', text: 'мы не начинали войну', weight: 8, category: 'propaganda', lang: 'ru', hits: 0, syncedAt: 0 },
  { id: 'prop4', text: 'у вас там нацисти', weight: 9, category: 'propaganda', lang: 'ru', hits: 0, syncedAt: 0 },
  { id: 'prop5', text: 'денацифікація', weight: 8, category: 'propaganda', lang: 'ru', hits: 0, syncedAt: 0 },
  { id: 'prop6', text: 'зачем ви воюєте з Росією', weight: 7, category: 'propaganda', lang: 'uk', hits: 0, syncedAt: 0 },
  { id: 'prop7', text: 'Україна це не страна', weight: 9, category: 'propaganda', lang: 'uk', hits: 0, syncedAt: 0 },
  { id: 'prop8', text: 'все вруть крім RT', weight: 7, category: 'propaganda', lang: 'uk', hits: 0, syncedAt: 0 },
  { id: 'prop9', text: 'США вас використовують', weight: 6, category: 'propaganda', lang: 'uk', hits: 0, syncedAt: 0 },
  // Meme phrases
  { id: 'meme1', text: 'а де український мова', weight: 5, category: 'meme', lang: 'uk', hits: 0, syncedAt: 0 },
  { id: 'meme2', text: 'скинь фоточки', weight: 4, category: 'meme', lang: 'uk', hits: 0, syncedAt: 0 },
  // Creepy phrases
  { id: 'creep1', text: 'ты симпатична', weight: 5, category: 'creepy', lang: 'ru', hits: 0, syncedAt: 0 },
  { id: 'creep2', text: 'скинь нюдс', weight: 10, category: 'creepy', lang: 'ru', hits: 0, syncedAt: 0 },
];

export default {
  generateWeighted,
  generateCard,
  checkBingo,
  defaultPhrases,
};