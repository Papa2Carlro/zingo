import type { Phrase, BingoCard } from '../types';

export function generateCard(
  phrases: Phrase[],
  size: number = 5,
  preset?: BingoCard
): BingoCard {
  const pool = preset
    ? preset.phrases.map(id => phrases.find(p => p.id === id)).filter(Boolean) as Phrase[]
    : [...phrases];

  if (pool.length < size * size) {
    throw new Error(`Not enough phrases: need ${size * size}, have ${pool.length}`);
  }

  const weighted = pool
    .map(p => ({ phrase: p, score: Math.random() ** (1 / Math.max(1, p.weight)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, size * size)
    .map(x => x.phrase.id);

  return {
    id: crypto.randomUUID(),
    name: preset?.name || 'Auto',
    size,
    phrases: weighted,
    isPreset: false,
    createdAt: Date.now(),
  };
}

export function generateWeighted(phrases: Phrase[], count: number): string[] {
  const weighted = phrases
    .map(p => ({ phrase: p, score: Math.random() ** (1 / Math.max(1, p.weight)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(x => x.phrase.id);
  return weighted;
}

export function checkBingo(card: BingoCard, marked: Record<string, number>): string[] {
  const size = card.size;
  const lines: string[] = [];

  // Rows
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      if (marked[card.phrases[idx]]) row.push(card.phrases[idx]);
    }
    if (row.length === size) lines.push(`row-${r}`);
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const col = [];
    for (let r = 0; r < size; r++) {
      const idx = r * size + c;
      if (marked[card.phrases[idx]]) col.push(card.phrases[idx]);
    }
    if (col.length === size) lines.push(`col-${c}`);
  }

  // Diagonals
  const diag1 = [];
  const diag2 = [];
  for (let i = 0; i < size; i++) {
    const idx1 = i * size + i;
    const idx2 = i * size + (size - 1 - i);
    if (marked[card.phrases[idx1]]) diag1.push(card.phrases[idx1]);
    if (marked[card.phrases[idx2]]) diag2.push(card.phrases[idx2]);
  }
  if (diag1.length === size) lines.push('diag-main');
  if (diag2.length === size) lines.push('diag-anti');

  return lines;
}