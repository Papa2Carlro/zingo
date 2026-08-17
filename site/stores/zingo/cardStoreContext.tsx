import { createContext, useContext } from 'react';
import { createCardStore, type CardStore } from './cardStore';

export const CardStoreContext = createContext<CardStore | null>(null);

export const CardStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const store = createCardStore();
  return <CardStoreContext.Provider value={store}>{children}</CardStoreContext.Provider>;
};

export const useCardStore = <T,>(selector: (state: CardStore) => T): T => {
  const store = useContext(CardStoreContext);
  if (!store) {
    throw new Error('useCardStore must be used within CardStoreProvider');
  }
  return selector(store);
};