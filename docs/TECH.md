# Технічні деталі

## Пакет bingo-generator

### Структура
`packages/bingo-generator/`
- `index.ts` — головний файл з експортами
- `package.json` — манифест пакету
- `types.ts` — інтерфейси Phrase, BingoCard

### Експорти
- `generateWeighted(phrases, count)` — weighted random selection
- `generateCard(phrases, options)` — створення картки
- `checkBingo(card, marked)` — перевірка бінго
- `defaultPhrases` — дефолтний набір фraz

### Використання
```bash
npm install ./packages/bingo-generator
# або
yarn add ./packages/bingo-generator
```

### Інтеграція
- **Екстеншн (WXT):** імпорт з `bingo-generator` (local path)
- **Сайт:** CDN import або локальний node_modules
- **Бекенд:** можна портити на Go або використовувати через ts-node

### Основні файли проєкту
- `extension/src/core/bingo-card.ts` — Shadow DOM компонент бінго
- `extension/src/core/parser.ts` — автономний чат-парсер
- `extension/src/core/generator-utils.ts` — front-end utilities
- `extension/src/db/` — IndexedDB схема
- `docs/ARCHITECTURE.md` — архітектурна документація
- `docs/TECH.md` — технічні деталі
- storage
- contextMenus

### IndexedDB схема — кеш
DB name: zingo
Stores:
- phrases кеш з бекенду
- cards
- sessions
- settings

### API endpoints
POST /api/events  → {phraseId, category, platform, ts}
GET  /api/phrases → список фраз
GET  /api/analytics/top → топ фраз
GET  /api/analytics/trends → тренди

### Генератор
Ваги нормалізуються до ймовірності. Використовуємо алгоритм weighted random without replacement.

### Матчер
Нормалізація:
- toLowerCase
- replace non-alphanum з пробіл
- remove stopwords

Fuzzy match: Levenshtein distance ≤ 2 для фраз довжиною > 15 символів

### Speech
Web Speech API: SpeechRecognition
continuous: true
lang: 'ru-RU'
onresult → нормалізація → match → toast

### i18n
i18next
Локалі:
- uk.json
- ru.json
- en.json

## Бекенд — з першого дня, аналітика 100%

Go 1.22+ — Gin, GORM, golang-migrate, zerolog
Postgres 16
Docker → Fly.io + Cloudflare Tunnel (free)

### Endpoints — Публічні (v1)
GET  /api/v1/phrases
POST /api/v1/events
GET  /api/v1/analytics/top?period=day|week|month
GET  /api/v1/analytics/trends
GET  /api/v1/analytics/categories

### Endpoints — Auth (опціонально)
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me

### Endpoints — Адмінка
GET  /api/v1/admin/phrases
POST /api/v1/admin/phrases
PATCH /api/v1/admin/phrases/:id
DELETE /api/v1/admin/phrases/:id
GET  /api/v1/admin/stats

### Auth
- Публічні: rate limit 100 req/min по anon_hash, 1000 req/min з JWT
- Опціональна реєстрація: nickname + password (bcrypt), email опціонально
- JWT HS256 24h
- Адмінка: JWT з env ADMIN_TOKEN

### Rate Limiting
- middleware: 100/1000 req/min
- Cloudflare WAF + API Key header `X-API-Key`

### CORS
- `*` для публічних `/api/v1/*`
- Обмежений для `/api/v1/auth/*` і `/api/v1/admin/*`

### DB
Postgres 16
Indexes: events(ts), events(phrase_id), events(platform), events(anon_hash), users(nickname)
Міграції: golang-migrate (SQL файли)

### Аналітика
Materialized view daily_phrase_stats
Cron оновлення кожні 15 хв

### Seed фраз
CLI `make seed` — імпорт з docs/PHRASES.md

### WebSocket
/ws/v1/leaderboard — auth по anon_hash або JWT

### Конфіг
cleanenv — структурований .env

### Логування
zerolog JSON

### Makefile цілі
run, build, test, migrate, migrate-down, seed, docker-build, docker-up, docker-down

### Docker Compose
postgres + backend

## Тести
- Vitest для core логіки
- Playwright для UI плагіна

## CI/CD
GitHub Actions → build → zip → release
