'use client';

import { useState, useEffect } from 'react';
import { useCardStore } from '@/stores/zingo';
import { generateCard } from '@/core/generator';
import type { BingoCard, Phrase } from '@/types';
import CardGrid from '../CardGrid';

interface CardBuilderProps {
  initialCard?: BingoCard;
  onSave?: (card: BingoCard) => void;
  onCancel?: () => void;
}

export default function CardBuilder({ 
  initialCard, 
  onSave, 
  onCancel 
}: CardBuilderProps) {
  const { phrases, saveCard } = useCardStore();
  const [cardName, setCardName] = useState(initialCard?.name || 'New Card');
  const [size, setSize] = useState<{ x: number; y: number }>(initialCard?.size || { x: 5, y: 5 });
  const [previewCard, setPreviewCard] = useState<BingoCard | null>(null);
  const [marked, setMarked] = useState<Record<string, number>>({});

  // Generate preview card when phrases or size change
  useEffect(() => {
    if (phrases.length > 0) {
      const newCard = generateCard(phrases, size, initialCard || undefined);
      setPreviewCard(newCard);
    }
  }, [phrases, size, initialCard]);

  const handleCellClick = (phraseId: string) => {
    setMarked(prev => ({
      ...prev,
      [phraseId]: prev[phraseId] ? undefined : Date.now()
    }));
  };

  const handleSave = async () => {
    if (!previewCard) return;
    
    const cardToSave: BingoCard = {
      ...previewCard,
      name: cardName,
      size,
    };
    
    await saveCard(cardToSave);
    onSave?.(cardToSave);
  };

  const handleRegenerate = () => {
    if (phrases.length > 0) {
      const newCard = generateCard(phrases, size);
      setPreviewCard(newCard);
      setMarked({});
    }
  };

  if (phrases.length === 0) {
    return (
      <div className="zingo-card p-6 text-center">
        <p className="text-slate-400">Loading phrases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {initialCard ? 'Edit Card' : 'Create New Card'}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Card Name
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white focus:border-sky-500 focus:outline-none"
              placeholder="Enter card name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Grid Size
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-slate-400 mb-1">Width</label>
                <select
                  value={size.x}
                  onChange={(e) => setSize(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                  className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white focus:border-sky-500 focus:outline-none"
                >
                  {[3, 4, 5, 6, 7].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-slate-400 mb-1">Height</label>
                <select
                  value={size.y}
                  onChange={(e) => setSize(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                  className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white focus:border-sky-500 focus:outline-none"
                >
                  {[3, 4, 5, 6, 7].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              className="flex-1 p-3 bg-sky-600 hover:bg-sky-700 text-white rounded font-medium transition-colors"
            >
              🔄 Regenerate Card
            </button>
            <button
              onClick={handleSave}
              className="flex-1 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
            >
              💾 Save Card
            </button>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full p-3 bg-slate-600 hover:bg-slate-700 text-white rounded font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Preview</h3>
          {previewCard && (
            <CardGrid
              card={previewCard}
              marked={marked}
              onCellClick={handleCellClick}
              readOnly={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}