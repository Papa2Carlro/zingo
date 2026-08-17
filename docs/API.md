# API референс

## Core

### generator.ts (зі пакету bingo-generator)
```ts
generateCard(phrases: Phrase[], size?: number, preset?: BingoCard): BingoCard
generateWeighted(phrases: Phrase[], count: number): string[]
```

### matcher.ts
```ts
normalize(text: string): string
fuzzyMatch(input: string, phrases: Phrase[]): Match[]
levenshtein(a: string, b: string): number
```

### parser.ts (НОВО)
```ts
parseChatText(text: string, phrases: Phrase[], options?: ParserOptions): ParseResult[]
findBestMatch(text: string, phrases: Phrase[]): ParseResult | null
batchParse(texts: string[], phrases: Phrase[], options?: ParserOptions): ParseResult[][]
normalize(text: string): string
levenshtein(a: string, b: string): number
```

### db/idb.ts
```ts
getPhrases(): Promise<Phrase[]>
getCards(): Promise<BingoCard[]>
getCurrentSession(): Promise<GameSession | null>
saveSession(session: GameSession): Promise<void>
```

### speech.ts
```ts
startRecognition(lang: string): void
stopRecognition(): void
onTranscript(cb: (text: string) => void): void
```

## UI

### BingoCard
Props: config (size {x: number, y: number}, phrases: Phrase[], name?: string)
Events: cell-click, bingo-lines-detected

### ToastConfirm
Props: phrase, onConfirm, onReject
