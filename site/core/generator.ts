import type { Phrase, BingoCard } from '@/types';

export function generateCard(
  phrases: Phrase[],
  size: { x: number; y: number } = { x: 5, y: 5 },
  preset?: BingoCard
): BingoCard {
  const totalCells = size.x * size.y;
  const availablePhrases = phrases.filter(p => p.weight > 0);
  
  if (availablePhrases.length === 0) {
    throw new Error('No phrases available for card generation');
  }

  // Weighted random selection
  const selectedPhrases: string[] = [];
  const weights = availablePhrases.map(p => p.weight);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < totalCells; i++) {
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    
    for (let j = 0; j < weights.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }
    
    selectedPhrases.push(availablePhrases[selectedIndex].id);
  }

  return {
    id: crypto.randomUUID(),
    name: preset?.name || 'New Card',
    size,
    phrases: selectedPhrases,
    isPreset: false,
    createdAt: Date.now(),
  };
}

export function checkBingo(card: BingoCard, marked: Record<string, number>): string[] {
  const { x: width, y: height } = card.size;
  const lines: string[] = [];

  // Check rows
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (marked[card.phrases[idx]]) row.push(card.phrases[idx]);
    }
    if (row.length === width) lines.push(...row);
  }

  // Check columns
  for (let x = 0; x < width; x++) {
    const col: string[] = [];
    for (let y = 0; y < height; y++) {
      const idx = y * width + x;
      if (marked[card.phrases[idx]]) col.push(card.phrases[idx]);
    }
    if (col.length === height) lines.push(...col);
  }

  // Check diagonals (only for square cards)
  if (width === height) {
    const diag1: string[] = [];
    const diag2: string[] = [];
    for (let i = 0; i < width; i++) {
      const idx1 = i * width + i;
      const idx2 = i * width + (width - 1 - i);
      if (marked[card.phrases[idx1]]) diag1.push(card.phrases[idx1]);
      if (marked[card.phrases[idx2]]) diag2.push(card.phrases[idx2]);
    }
    if (diag1.length === width) lines.push(...diag1);
    if (diag2.length === width) lines.push(...diag2);
  }

  return lines;
}