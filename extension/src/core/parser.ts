import type { Phrase } from '../types';

// Звитувальник тексту (теж можна вынести окремо)
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Взаємодія з matcher.ts Levenshtein distance
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  return dp[n];
}

// Типи для результатів parser
export interface MatchResult {
  phrase: Phrase;
  distance: number;
  confidence: number;
}

// Основний parser — працює з масивом фраз (як на сайті, так і в екстеншені)
export interface ParserOptions {
  threshold?: number;
  includeVariants?: boolean;
}

export interface ParseResult {
  phrase: Phrase;
  confidence: number;
  text: string;
}

/**
 * Парсит текст і шукає співпадаючі фрази
 * @param text - Вхідний текст з чату
 * @param phrases - Масив фраз для пошуку (може бути з IndexedDB)
 * @param options - Опції парсингу
 * @returns Масив знайдених фраз з рівнем assurance
 */
export function parseChatText(
  text: string,
  phrases: Phrase[],
  options: ParserOptions = {}
): ParseResult[] {
  const threshold = options.threshold ?? 0.8;
  const includeVariants = options.includeVariants ?? true;

  const normalizedText = normalize(text);
  const results: ParseResult[] = [];

  for (const phrase of phrases) {
    const normalizedPhrase = normalize(phrase.text);
    const maxLen = Math.max(normalizedText.length, normalizedPhrase.length);
    if (maxLen === 0) continue;

    const distance = levenshtein(normalizedText, normalizedPhrase);
    const confidence = 1 - distance / maxLen;

    if (confidence >= threshold) {
      results.push({
        phrase,
        confidence,
        text: phrase.text,
      });
    }

    // Check variants якщо включено
    if (includeVariants && phrase.variants) {
      for (const variant of phrase.variants) {
        const normVariant = normalize(variant);
        const dist = levenshtein(normalizedText, normVariant);
        const conf = 1 - dist / Math.max(normalizedText.length, normVariant.length);
        if (conf >= threshold) {
          results.push({
            phrase,
            confidence: conf,
            text: variant,
          });
        }
      }
    }
  }

  // Сортування за assurance (вищим перш)
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Знаходить найкращий матч
 * @param text - Вхідний текст
 * @param phrases - Масив фраз
 * @returns Найкращий матч або null
 */
export function findBestMatch(
  text: string,
  phrases: Phrase[]
): ParseResult | null {
  const matches = parseChatText(text, phrases);
  return matches.length > 0 ? { phrase: matches[0].phrase, confidence: matches[0].confidence, text: matches[0].text } : null;
}

/**
 * Batch parse — паралельний пошок у múltiple texts
 * @param texts - Масив текстів для парсингу
 * @param phrases - Масив фраз
 * @returns Масив результатів
 */
export function batchParse(
  texts: string[],
  phrases: Phrase[],
  options: ParserOptions = {}
): ParseResult[][] {
  return texts.map(text => parseChatText(text, phrases, options));
}

export default {
  parseChatText,
  findBestMatch,
  batchParse,
  normalize,
  levenshtein,
};