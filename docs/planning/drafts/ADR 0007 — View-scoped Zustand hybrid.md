# ADR 0007: View-scoped Zustand hybrid

## Status: Proposed
## Date: 2026-08-15

## Context
ZINGO plugin needs state management for:
- Bingo cards state
- Selected phrases
- User settings
- Chat parsing results

## Decision
Use Zustand with view-scoped stores:
- `cardStore` — current bingo card state
- `phraseStore` — selected/found phrases
- `uiStore` — theme, position, visibility

## Consequences
- ✅ Simple API, minimal boilerplate
- ❌ No persistence across sessions (need IndexedDB)
- ⚠️ Must sync with IDB on load