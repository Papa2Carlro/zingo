# Zingo Site

Next.js сайт з інтеграцією `zingo-formatter`.

## Швидкий старт

```bash
cd site
npm install
npm run dev
```

Відкрий http://localhost:3000

## Що всередині

- `app/page.tsx` — головна сторінка з чатом
- `components/ZingoToggle.tsx` — перемикач зінго-режиму
- `components/ChatMessage.tsx` — повідомлення з форматуванням

## Підключення

```ts
import { formatText } from 'zingo-formatter';

const result = formatText('Где вы были 8 лет?', { intensity: 'medium' });
```