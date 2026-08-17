import { formatText, createZingoFormatter, ZingoFormatter } from './formatter.js';
import type { ZingoOptions, ZingoFormatterInstance } from './types.js';

// Головні експорти (SSR-safe, без React)
export {
  formatText,
  createZingoFormatter,
  ZingoFormatter,
  type ZingoOptions,
  type ZingoFormatterInstance
};