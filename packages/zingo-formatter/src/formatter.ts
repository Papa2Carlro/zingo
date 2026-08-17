import { ZINGO_DICT } from './dictionary.js';
import { ZINGO_PATTERNS } from './dictionary.js';
import { ZingoOptions, ZingoFormatterInstance } from './types.js';

export class ZingoFormatter implements ZingoFormatterInstance {
  private options: Required<ZingoOptions>;
  private rng: () => number;

  constructor(options: ZingoOptions = {}) {
    this.options = {
      intensity: options.intensity || 'medium',
      keepPunctuation: options.keepPunctuation ?? true,
      seed: options.seed ?? Date.now(),
    };
    this.rng = this.mulberry32(this.options.seed);
  }

  private mulberry32(seed: number) {
    return () => {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private pickVariant(variants: string[]): string {
    const idx = Math.floor(this.rng() * variants.length);
    return variants[idx];
  }

  private applyPatterns(text: string): string {
    let result = text;
    const probability = this.options.intensity === 'hardcore' ? 1 : 
                       this.options.intensity === 'medium' ? 0.7 : 0.4;
    
    for (const [regex, replacement] of ZINGO_PATTERNS) {
      if (this.rng() < probability) {
        result = result.replace(regex, replacement);
      }
    }
    return result;
  }

  private applyDictionary(text: string): string {
    // Розбиваємо на слова + розділові знаки, зберігаючи їх
    const tokens = text.split(/(\s+|[.,!?;:()\[\]{}"'`«»—–-])/);
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token || /^[\s.,!?;:()\[\]{}"'`«»—–-]+$/.test(token)) continue;
      
      const lower = token.toLowerCase();
      
      if (ZINGO_DICT[lower]) {
        const shouldReplace = this.options.intensity === 'hardcore' 
          ? true 
          : this.options.intensity === 'medium' 
            ? this.rng() < 0.6 
            : this.rng() < 0.3;
        
        if (shouldReplace) {
          const variant = this.pickVariant(ZINGO_DICT[lower]);
          // Зберігаємо регістр першої літери
          tokens[i] = token[0] === token[0].toUpperCase() 
            ? variant[0].toUpperCase() + variant.slice(1)
            : variant;
        }
      }
    }
    
    return tokens.join('');
  }

  private addZingoFlavor(text: string): string {
    if (this.options.intensity !== 'hardcore') return text;
    
    // Додаємо зінго-частиці випадково в кінці речень
    const particles = [' ж', ' б', ' ли', ' то', ' всьо', ' ну', ' да', ' ага', ' оф', ' лол', ' кек', ' лол'];
    const sentences = text.split(/([.!?]+)/);
    
    return sentences.map((s, i) => {
      if (i % 2 === 0 && s.trim() && this.rng() < 0.15) {
        return s.trim() + this.pickVariant(particles);
      }
      return s;
    }).join('');
  }

  format(text: string): string {
    if (!text || !text.trim()) return text;
    let result = text;
    result = this.applyDictionary(result);
    result = this.applyPatterns(result);
    result = this.addZingoFlavor(result);
    return result;
  }

  setIntensity(intensity: ZingoOptions['intensity']) {
    if (intensity) this.options.intensity = intensity;
  }

  setSeed(seed: number) {
    this.options.seed = seed;
    this.rng = this.mulberry32(seed);
  }
}

// Головна функція для простого використання
export function formatText(text: string, options?: ZingoOptions): string {
  return new ZingoFormatter(options).format(text);
}

// Створити екземпляр для повторного використання (краще для продуктивності)
export function createZingoFormatter(options?: ZingoOptions): ZingoFormatterInstance {
  const formatter = new ZingoFormatter(options);
  return {
    format: (text: string) => formatter.format(text),
    setIntensity: (intensity) => formatter.setIntensity(intensity),
    setSeed: (seed) => formatter.setSeed(seed),
  };
}