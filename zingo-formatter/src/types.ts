export interface ZingoOptions {
  intensity?: 'light' | 'medium' | 'hardcore';
  keepPunctuation?: boolean;
  seed?: number;
}

export interface ZingoFormatterInstance {
  format: (text: string) => string;
  setIntensity: (intensity: ZingoOptions['intensity']) => void;
  setSeed: (seed: number) => void;
}