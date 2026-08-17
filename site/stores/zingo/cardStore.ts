import { create } from 'zustand';
import type { BingoCard, Phrase } from '@/types';

export interface CardStore {
  cards: BingoCard[];
  currentCard: BingoCard | null;
  phrases: Phrase[];
  setPhrases: (phrases: Phrase[]) => void;
  addCard: (card: BingoCard) => void;
  updateCard: (card: BingoCard) => void;
  deleteCard: (id: string) => void;
  setCurrentCard: (card: BingoCard | null) => void;
  loadCards: () => Promise<void>;
  saveCard: (card: BingoCard) => Promise<void>;
}

export const createCardStore = () =>
  create<CardStore>()((set, get) => ({
    cards: [],
    currentCard: null,
    phrases: [],
    
    setPhrases: (phrases) => set({ phrases }),
    
    addCard: (card) => set((state) => ({ 
      cards: [...state.cards, card],
      currentCard: card 
    })),
    
    updateCard: (card) => set((state) => ({
      cards: state.cards.map(c => c.id === card.id ? card : c),
      currentCard: state.currentCard?.id === card.id ? card : state.currentCard
    })),
    
    deleteCard: (id) => set((state) => ({
      cards: state.cards.filter(c => c.id !== id),
      currentCard: state.currentCard?.id === id ? null : state.currentCard
    })),
    
    setCurrentCard: (card) => set({ currentCard: card }),
    
    loadCards: async () => {
      // Load from localStorage for now, later from API
      try {
        const stored = localStorage.getItem('zingo-cards');
        if (stored) {
          const cards = JSON.parse(stored);
          set({ cards });
        }
      } catch (e) {
        console.warn('Failed to load cards:', e);
      }
    },
    
    saveCard: async (card) => {
      const { cards } = get();
      const exists = cards.some(c => c.id === card.id);
      const newCards = exists 
        ? cards.map(c => c.id === card.id ? card : c)
        : [...cards, card];
      
      set({ cards: newCards, currentCard: card });
      localStorage.setItem('zingo-cards', JSON.stringify(newCards));
    },
  }));