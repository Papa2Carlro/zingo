# Zingo Formatter - Integration Guide

## 🎯 Що це

Один і той самий код працює:
1. **В extension** (Chrome/Firefox/Edge)
2. **На сайті** (через `<script>` або ESM)

## 📦 Встановлення

```bash
cd /Users/maksympryimak/zingo/zingo-formatter
npm install
npm run build        # TypeScript -> ESM
npm run build:browser # Vite -> browser bundles
```

## 🔧 В extension (вже інтегровано!)

### Що зроблено:
- ✅ `extension/package.json` — додано `zingo-formatter` як залежність
- ✅ `extension/src/types/index.ts` — додано `zingoMode` та `zingoIntensity` в Settings
- ✅ `extension/src/db/storage.ts` — дефолтні значення для нових полів
- ✅ `extension/entrypoints/popup/popup.html` — додано UI: тумблер + селект інтенсивності
- ✅ `extension/entrypoints/popup/popup.ts` — біндінг подій та збереження налаштувань
- ✅ `extension/src/ui/bingo.ts` — форматування фраз та тостів при зінго-режимі

### Як працює:
1. Користувач увімкає "Зінго режим" в попупі
2. Налаштування зберігається в IndexedDB
3. При рендері картки `BingoUI.formatText()` перетворює фрази
4. Тост при розпізнаванні мови теж форматується

## 🌐 На сайті (два способи)

### Спосіб 1: ESM (сучасний)
```html
<script type="module">
  import { formatText } from './dist/browser.es.js';
  
  const result = formatText('Где вы были 8 лет?', { intensity: 'medium' });
  console.log(result); // "Гдє ви били 8 лЄт?"
</script>
```

### Спосіб 2: UMD (через script тег)
```html
<script src="./dist/browser.umd.js"></script>
<script>
  const result = ZingoFormatter.formatText('Где вы были 8 лет?', { intensity: 'hardcore' });
  console.log(result);
</script>
```

### Спосіб 3: React компонент
```tsx
import { ZingoText, useZingoFormatter } from 'zingo-formatter/react';

function App() {
  const [zingoMode, setZingoMode] = useState(false);
  const format = useZingoFormatter(zingoMode, { intensity: 'medium' });
  
  return (
    <div>
      <label>
        <input type="checkbox" checked={zingoMode} onChange={e => setZingoMode(e.target.checked)} />
        🎯 Зінго-режим
      </label>
      <p>{format('Где вы были 8 лет?')}</p>
    </div>
  );
}
```

## 📁 Файли

```
zingo-formatter/
├── dist/
│   ├── index.js              # Node.js / ESM
│   ├── browser.es.js         # Browser ESM
│   ├── browser.umd.js        # Browser UMD (global ZingoFormatter)
│   └── *.d.ts                # TypeScript declarations
├── examples/
│   └── website.html          # Приклад використання на сайті
├── src/
│   ├── index.ts              # Головний експорт
│   ├── formatter.ts          # Логіка форматування
│   ├── dictionary.ts         # Словник замін + патерни
│   ├── react.tsx             # React hook/компонент
│   ├── cli.ts                # CLI інструмент
│   └── test.ts               # Тести
└── package.json
```

## 🔄 Оновлення

Якщо змінив словник або логіку:
```bash
cd /Users/maksympryimak/zingo/zingo-formatter
npm run build && npm run build:browser
```

В extension зміни підхопляться автоматично при `npm run build` (через `file:` залежність).

## 🎨 Інтенсивності

| Рівень | Що робить |
|--------|-----------|
| `light` | Тільки словник, 30% слів |
| `medium` | Словник + патерни, 60% слів |
| `hardcore` | Все + частинки ("ж", "б", "ага") |

## 🧪 Тести

```bash
cd /Users/maksympryimak/zingo/zingo-formatter
npm test
```

## 📝 API

```ts
import { formatText, createZingoFormatter, ZingoFormatter } from 'zingo-formatter';

// Простий виклик
formatText('Где вы были 8 лет?', { intensity: 'medium' });

// З детермінованістю (для тестів)
formatText('текст', { intensity: 'medium', seed: 12345 });

// Повторне використання (швидше)
const fmt = createZingoFormatter({ intensity: 'hardcore' });
fmt('текст 1');
fmt('текст 2');
```