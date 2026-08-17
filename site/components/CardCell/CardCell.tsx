'use client';

import { formatText } from 'zingo-formatter';

interface CardCellProps {
  phrase: string;
  isMarked: boolean;
  isBingo: boolean;
  onClick: () => void;
  zingoEnabled?: boolean;
  intensity?: 'light' | 'medium' | 'hardcore';
}

export default function CardCell({
  phrase,
  isMarked,
  isBingo,
  onClick,
  zingoEnabled = false,
  intensity = 'medium',
}: CardCellProps) {
  const displayText = zingoEnabled ? formatText(phrase, { intensity }) : phrase;

  return (
    <button
      className={`zingo-cell ${isMarked ? 'marked' : ''} ${isBingo ? 'bingo' : ''}`}
      onClick={onClick}
      style={{ 
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        textAlign: 'center',
        wordBreak: 'break-word',
      }}
    >
      <span className={isBingo ? 'bingo-text' : ''}>{displayText}</span>
    </button>
  );
}