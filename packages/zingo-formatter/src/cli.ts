#!/usr/bin/env node
import { formatText } from './formatter.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { stdin } from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

const intensity = (args.find(a => a.startsWith('-i='))?.split('=')[1] as any) || 'medium';
const seed = args.find(a => a.startsWith('-s='))?.split('=')[1] ? parseInt(args.find(a => a.startsWith('-s='))!.split('=')[1]!) : undefined;
const inputFile = args.find(a => !a.startsWith('-') && !a.startsWith('-o'));
const outputFile = args.find(a => a.startsWith('-o='))?.split('=')[1];

let text = '';
try {
  if (inputFile) {
    text = readFileSync(resolve(inputFile), 'utf-8');
  } else {
    // Read from stdin
    text = readFileSync(0, 'utf-8');
  }
} catch {
  console.error('Error reading input');
  process.exit(1);
}

const result = formatText(text, { intensity: intensity as any, seed });

if (outputFile) {
  try {
    writeFileSync(resolve(outputFile), result);
    console.error(`✅ Formatted → ${outputFile}`);
  } catch {
    console.error('Error writing output');
    process.exit(1);
  }
} else {
  process.stdout.write(result);
}