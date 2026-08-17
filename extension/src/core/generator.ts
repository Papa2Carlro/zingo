import type { Phrase, BingoCard } from '../types';

export function generateCard(
  phrases: Phrase[],
  size: { x: number; y: number } = { x: 5, y: 5 },
  preset?: BingoCard
): BingoCard {
  const totalCells = size.x * size.y;
  const pool = preset
    ? preset.phrases.map(id => phrases.find(p => p.id === id)).filter(Boolean) as Phrase[]
    : [...phrases];

  if (pool.length < totalCells) {
    throw new Error(`Not enough phrases: need ${totalCells}, have ${pool.length}`);
  }

  const weighted = pool
    .map(p => ({ phrase: p, score: Math.random() ** (1 / Math.max(1, p.weight)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, totalCells)
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
  const { x: width, y: height } = card.size;
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