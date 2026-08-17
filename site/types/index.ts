export interface Phrase {
  id: string;
  text: string;
  variants?: string[];
  weight: number;
  category: string;
  lang: string;
  tags?: string[];
  hits: number;
  syncedAt?: number;
}

export interface BingoCard {
  id: string;
  name: string;
  size: { x: number; y: number };
  phrases: string[]; // phrase IDs
  isPreset: boolean;
  createdAt: number;
}

export interface GameSession {
  id: string;
  cardId: string;
  marked: Record<string, number>; // phraseId -> timestamp
  startedAt: number;
  completedAt?: number;
  platform: string;
  bingoLines?: string[];
}

export interface Settings {
  apiBaseUrl: string;
  apiKey?: string;
  anonHash: string;
  userId?: string;
  jwtToken?: string;
  speechEnabled: boolean;
  speechLang: string;
  uiLanguage: 'uk' | 'ru' | 'en';
  theme: 'dark' | 'light';
  position: 'right' | 'left' | 'bottom';
  soundEnabled: boolean;
  autoDetect: boolean;
  showWeights: boolean;
  zingoMode: boolean;
  zingoIntensity: 'light' | 'medium' | 'hardcore';
}

export interface AnalyticsEvent {
  id?: string;
  phraseId: string;
  category: string;
  platform: string;
  anonHash: string;
  userId?: string;
  timestamp: number;
  source: 'manual' | 'speech' | 'text';
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  bingos: number;
  gamesPlayed: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}