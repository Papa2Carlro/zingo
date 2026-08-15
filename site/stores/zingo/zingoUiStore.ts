import { create } from 'zustand';

export type ZingoIntensity = 'light' | 'medium' | 'hardcore';

export interface ZingoUiStore {
  enabled: boolean;
  intensity: ZingoIntensity;
  setEnabled: (enabled: boolean) => void;
  setIntensity: (intensity: ZingoIntensity) => void;
  toggle: () => void;
}

export const createZingoUiStore = () =>
  create<ZingoUiStore>()((set) => ({
    enabled: false,
    intensity: 'medium',
    setEnabled: (enabled) => set({ enabled }),
    setIntensity: (intensity) => set({ intensity }),
    toggle: () => set((state) => ({ enabled: !state.enabled })),
  }));