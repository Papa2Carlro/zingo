# Технічні деталі

## Плагін WXT

### Структура
entrypoints/
  background.ts
  content.ts
  offscreen.ts
  popup.html / popup.ts
  options.html / options.ts
src/
  db/schema.ts
  db/idb.ts
  core/generator.ts
  core/matcher.ts
  core/speech.ts
  i18n/
  ui/bingo/
  ui/toast/
  types.ts

### manifest.json згенеровано WXT
host_permissions:
- https://*.omegle.com/*
- https://*.chatroulette.com/*
- https://*.emeraldchat.com/*
- https://*.monkey.app/*

permissions:
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

### Endpoints — Публічні
GET  /api/phrases
POST /api/events
GET  /api/analytics/top?period=day|week|month
GET  /api/analytics/trends
GET  /api/analytics/categories

### Endpoints — Адмінка
GET  /api/admin/phrases
POST /api/admin/phrases
PATCH /api/admin/phrases/:id
DELETE /api/admin/phrases/:id
GET  /api/admin/stats

### Auth
- Публічні: rate limit по anon_hash
- Адмінка: Basic Auth / JWT з env ADMIN_TOKEN

### Rate Limiting
- middleware: 100 req/min на anon_hash
- Cloudflare WAF

### DB
Postgres 16
Indexes: events(ts), events(phrase_id), events(platform), events(anon_hash)
Міграції: golang-migrate

### Аналітика
Materialized view daily_phrase_stats
Cron оновлення кожні 15 хв

### Seed фраз
CLI `make seed` — імпорт з docs/PHRASES.md

### WebSocket
/ws/leaderboard — real-time топ гравців

## Тести
- Vitest для core логіки
- Playwright для UI плагіна

## CI/CD
GitHub Actions → build → zip → release
