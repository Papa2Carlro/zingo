# ZINGO — Chatroulette Propaganda Bingo

**Дата:** 2026-08-15  
**Статус:** MVP планування  
**Тип:** Open source, fan project, демонстрація

## 1. Контекст

Міні проєкт для людей, які спілкуються з росіянами в чат-рулетках.  
Механіка бінго: слухаєш/читаєш фрази з рос. пропаганди / мемів / стат-паттернів і відмічаєш їх на картці.  
Кожна фраза має вагу. Алгоритм формує картки. При збігу — відмітка.

**Ціль:** фан, open source, демо. Не монетизація.  
**Фокус:** тільки російська пропаганда та пов’язані фрази.

## 2. Цільова аудиторія
- Користувачі Omegle, Chatroulette, Emerald, Monkey, інші веб-чат-рулетки
- Стрімери / шукачі контенту

## 3. Варіант реалізації
Гібрид. Етап 1 — тільки браузерний плагін MV3. Етап 2 — бекенд + лендінг + адмінка.

## 4. Функції MVP

### Плагін (MV3)
- Content Script інжектить UI бінго-картки в Shadow DOM
- Працює на whitelist сайтах чат-рулеток
- IndexedDB кеш локально + синхронізація з бекендом
- База фраз, карток, сесій, статистика
- Збір аналітики: кожне відмічання, кожен детект відправляється на бекенд
- Генерація карток з ваговим вибором
- Ручне клікання по клітинці
- Автодетект: Web Speech API / розпізнавання тексту з чату
  - Детект → підказка "Чи правильно почув?" → підтвердження/відхилення користувачем
- Експорт/імпорт JSON
- i18n: UI на uk / ru / en

### Бекенд з першого дня
- Збір аналітики 100%: фрази, частота, категорії, популярність
- Графіки популярності, тренди, топ фраз
- Лідерборди онлайн
- Фрази — preset + community submissions через адмінку
- Реєстрація опціональна

## 5. Тех стек

### Фронт / Плагін
- TypeScript
- WXT v0.19+ для MV3 плагіна
- IndexedDB wrapper: idb для кешу
- Валідація: zod
- ID: nanoid
- UI: Vanillа TS + CSS-in-JS / Lite UI без фреймворків
- i18n: i18next
- Аналітика відправка: fetch → бекенд API
- WebSocket для real-time лідербордів

### Бекенд — з першого дня
Go 1.22+ — Gin, GORM, golang-migrate, zerolog
Postgres 16
Docker → Fly.io + Cloudflare Tunnel (free)
Варіант A: Go
- Gin / Fiber
- PostgreSQL
- Redis для realtime

Варіант B: Python
- FastAPI
- PostgreSQL
- SQLModel / SQLAlchemy

### Лендінг / Адмінка — опція
- Astro / Next.js + Tailwind
- Supabase / PocketBase

## 6. Модель даних

### Phrase
```ts
{
  id: string;
  text: string;      // "братські народи"
  variants?: string[]; // нормалізовані варіанти
  weight: number;     // 1-10
  category: string;   // propaganda, meme, creepy, standard
  lang: string;       // ru
  tags?: string[];
  addedBy?: string;
  createdAt: number;
}
```

### BingoCard
```ts
{
  id: string;
  name: string;
  size: number; // 5
  phrases: string[]; // phrase IDs
  isPreset: boolean;
  createdAt: number;
}
```

### GameSession
```ts
{
  id: string;
  cardId: string;
  marked: Record<string, number>; // phraseId -> timestamp
  startedAt: number;
  completedAt?: number;
  platform: string;
  bingoLines?: string[];
}
```

## 7. Алгоритм генерації картки
Ваговий випадковий вибір без повторів:
```ts
score = Math.random() ** (1 / weight)
```
Сортування по score, беремо top N.  
Preset картки — фіксований набір.

## 8. Детект фраз

### Варіант A: Текстовий парсинг
Content Script слухає DOM mutations в чаті, нормалізує текст, fuzzy match проти бази.

### Варіант B: Speech API
Web Speech API для розпізнавання мови з вкладки/мікрофону.
Обмеження: потрібен доступ до аудіо, дозвіл user-а.
Рішення: детект → показати toast "Схоже на 'братські народи'?" [Так / Ні / Ігнорувати]

### Підтвердження
Користувач завжди підтверджує автодетект.

## 9. i18n
- uk, ru, en
- Фрази зберігаються в оригіналі ru
- UI перекладається

## 10. Структура плагіна WXT

```
/entrypoints
  background.ts
  content.ts
  popup.html/ts
/assets
/src
  db/
  i18n/
  ui/
  core/
```

**Manifest V3**
- host_permissions: omegle.com, chatroulette.com, emeraldchat.com, monkey.app
- permissions: storage, contextMenus, offscreen? для speech

## 11. План релізу

**День 0 — 2026-08-15**
- Документація SPEC
- Створення репозиторію, структура WXT

**День 1 — 2026-08-16**
- Базовий плагін: попап, IndexedDB, генерація карти
- UI бінго 5x5 в Shadow DOM
- Preset база фраз 50 шт

**День 2**
- Ручне відмічання
- Детект тексту в чаті
- Speech детект + підказка

**День 3**
- i18n
- Експорт/імпорт
- Пакет для Chrome Web Store

## 12. Є в MVP
- Збір аналітики та графіки популярності
- Лідерборди онлайн
- Адмінка CRUD фраз
- Статистика на лендінгу

## Немає в MVP
- Мультиплеєр
- Монетизація
- Модерація в реальному часі

## 13. Ризики
- Web Speech API не працює з вкладки, тільки мікрофон
- Сайти чат-рулеток блокують інжект
- Рос. фрази — чутлива тема, open source → варто ліцензію MIT і дисклеймер

## 14. Ліцензія
MIT

## 15. Наступні кроки
1. Створити scaffolding WXT
2. Заповнити docs/PHRASES.md початковим списком
3. Реалізувати DB layer
4. UI картки
