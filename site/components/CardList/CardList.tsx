'use client';

import { useState } from 'react';
import { useCardStore } from '@/stores/zingo';
import CardGrid from '../CardGrid';
import CardBuilder from '../CardBuilder';
import type { BingoCard } from '@/types';

export default function CardList() {
  const { cards, setCurrentCard, deleteCard, loadCards } = useCardStore();
  const [editingCard, setEditingCard] = useState<BingoCard | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const handleEdit = (card: BingoCard) => {
    setEditingCard(card);
    setShowBuilder(true);
  };

  const handleNewCard = () => {
    setEditingCard(null);
    setShowBuilder(true);
  };

  const handleSave = (card: BingoCard) => {
    setShowBuilder(false);
    setEditingCard(null);
  };

  const handleCancel = () => {
    setShowBuilder(false);
    setEditingCard(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this card?')) {
      await deleteCard(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Cards</h2>
        <button
          onClick={handleNewCard}
          className="p-3 bg-sky-600 hover:bg-sky-700 text-white rounded font-medium transition-colors"
        >
          ➕ New Card
        </button>
      </div>

      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardBuilder
              initialCard={editingCard || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="zingo-card p-12 text-center">
          <p className="text-slate-400 text-lg mb-4">No cards yet</p>
          <p className="text-slate-500 mb-6">Create your first bingo card to get started!</p>
          <button
            onClick={handleNewCard}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded font-medium transition-colors"
          >
            Create Your First Card
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.id} className="zingo-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{card.name}</h3>
                  <p className="text-sm text-slate-400">
                    {card.size.x}×{card.size.y} • {new Date(card.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <CardGrid
                card={card}
                marked={{}}
                readOnly={true}
              />
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(card)}
                  className="flex-1 p-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(card.id)}
                  className="flex-1 p-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}