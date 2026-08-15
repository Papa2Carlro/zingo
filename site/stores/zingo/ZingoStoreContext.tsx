import { createContext, useContext } from 'react';
import { createZingoUiStore, type ZingoUiStore } from './zingoUiStore';

export const ZingoStoreContext = createContext<ZingoUiStore | null>(null);

export const ZingoStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const store = createZingoUiStore();
  return <ZingoStoreContext.Provider value={store}>{children}</ZingoStoreContext.Provider>;
};

export const useZingoStore = <T,>(selector: (state: ZingoUiStore) => T): T => {
  const store = useContext(ZingoStoreContext);
  if (!store) {
    throw new Error('useZingoStore must be used within ZingoStoreProvider');
  }
  return selector(store);
};