# Developer Guide

## Швидкий старт
```bash
npm i -g wxt
wxt init zingo
npm install
npm run dev
```

## Структура WXT
entrypoints/background.ts — service worker
entrypoints/content.ts — інжект UI
entrypoints/offscreen.ts — speech
entrypoints/popup.html — попап

## Локальна БД
idb wrapper:
```ts
import { openDB } from 'idb';
const db = await openDB('zingo', 1, { upgrade(db){ db.createObjectStore('phrases'); }});
```

## Додавання фраз
Редагуй docs/PHRASES.md, потім запусти скрипт міграції /tools/seed.ts

## i18n
Файли в src/i18n/{uk,ru,en}.json
Використовуй i18next

## Реліз
```bash
npm run build
npm run zip
```

## Контрибьют
PR вітаються

## Debug
Chrome → Extensions → Load unpacked → ./wxt/.output/chrome-mv3
