import type { Phrase } from '../types';

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

export interface MatchResult {
  phrase: Phrase;
  distance: number;
  confidence: number;
}

export function fuzzyMatch(input: string, phrases: Phrase[], threshold = 0.8): MatchResult[] {
  const normalizedInput = normalize(input);
  const results: MatchResult[] = [];

  for (const phrase of phrases) {
    const normalizedPhrase = normalize(phrase.text);
    const maxLen = Math.max(normalizedInput.length, normalizedPhrase.length);
    if (maxLen === 0) continue;

    const distance = levenshtein(normalizedInput, normalizedPhrase);
    const confidence = 1 - distance / maxLen;

    if (confidence >= threshold) {
      results.push({ phrase, distance, confidence });
    }

    // Check variants
    if (phrase.variants) {
      for (const variant of phrase.variants) {
        const normVariant = normalize(variant);
        const dist = levenshtein(normalizedInput, normVariant);
        const conf = 1 - dist / Math.max(normalizedInput.length, normVariant.length);
        if (conf >= threshold) {
          results.push({ phrase, distance: dist, confidence: conf });
        }
      }
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

export function findBestMatch(input: string, phrases: Phrase[]): MatchResult | null {
  const matches = fuzzyMatch(input, phrases);
  return matches.length > 0 ? matches[0] : null;
}