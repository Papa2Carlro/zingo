'use client';

import { useCardStore } from '@/stores/zingo';
import CardCell from '../CardCell';
import type { BingoCard } from '@/types';
import { checkBingo } from '@/core/generator';

interface CardGridProps {
  card: BingoCard;
  marked?: Record<string, number>;
  onCellClick?: (phraseId: string) => void;
  zingoEnabled?: boolean;
  intensity?: 'light' | 'medium' | 'hardcore';
  readOnly?: boolean;
}

export default function CardGrid({
  card,
  marked = {},
  onCellClick,
  zingoEnabled = false,
  intensity = 'medium',
  readOnly = false,
}: CardGridProps) {
  const { x: width, y: height } = card.size;
  const bingoLines = checkBingo(card, marked);

  const isBingoCell = (phraseId: string) => {
    return bingoLines.some(line => line.includes(phraseId));
  };

  const handleCellClick = (phraseId: string) => {
    if (readOnly || !onCellClick) return;
    onCellClick(phraseId);
  };

  return (
    <div 
      className="zingo-card" 
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${height}, 1fr)`,
        gap: '4px',
        maxWidth: '100%',
      }}
    >
      {card.phrases.map((phraseId, idx) => (
        <CardCell
          key={phraseId}
          phrase={phraseId}
          isMarked={!!marked[phraseId]}
          isBingo={isBingoCell(phraseId)}
          onClick={() => handleCellClick(phraseId)}
          zingoEnabled={zingoEnabled}
          intensity={intensity}
        />
      ))}
    </div>
  );
}