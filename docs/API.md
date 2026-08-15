# API референс

## Core

### generator.ts
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

### BingoGrid
Props: card, onMark
Events: cellMarked, bingoDetected

### ToastConfirm
Props: phrase, onConfirm, onReject
