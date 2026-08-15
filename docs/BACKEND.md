# Backend

## Вибір стека
Go 1.22+ — Gin, GORM, golang-migrate, zerolog

## Деплой
Docker → Fly.io (free tier) + Cloudflare Tunnel (free) для HTTPS + DDoS protection

## Структура
cmd/api/main.go
internal/
  handler/
  service/
  repo/
  model/
  analytics/
  middleware/
pkg/
  db/
  logger/
  config/

## Models
Phrase {id, text, variants, weight, category, lang, created_at}
Event {id, phrase_id, category, platform, ts, anon_hash}
CardPreset {id, name, phrases[]}
User {id, nickname, password_hash, email?, created_at, anon_hash}  // опціональний акаунт

## Endpoints — Публічні (v1)
GET  /api/v1/phrases
POST /api/v1/events
GET  /api/v1/analytics/top?period=day|week|month
GET  /api/v1/analytics/trends
GET  /api/v1/analytics/categories

## Endpoints — Auth (опціонально)
POST /api/v1/auth/register     // nickname + password (+ email опціонально)
POST /api/v1/auth/login
GET  /api/v1/auth/me           // JWT → user info + stats

## Endpoints — Адмінка (окремий SPA на /admin)
GET  /api/v1/admin/phrases
POST /api/v1/admin/phrases
PATCH /api/v1/admin/phrases/:id
DELETE /api/v1/admin/phrases/:id
GET  /api/v1/admin/stats

## Auth
- Публічні ендпоїнти: rate limit по anon_hash (100 req/min без акаунта, 1000 req/min з акаунтом)
- Опціональна реєстрація: nickname + password (bcrypt), email опціонально для відновлення
- JWT токен (HS256, 24h) для автентифікованих запитів
- Адмінка: JWT з env ADMIN_TOKEN або окремий admin user

## Rate Limiting
- middleware: 100 req/min на anon_hash (без акаунта), 1000 req/min (з акаунтом)
- Cloudflare WAF правила + API Key для публічного API (опціонально)
- API Key в header `X-API-Key` для вищих лімітів

## CORS
- `*` для `/api/v1/*` публічних
- Обмежений origins для `/api/v1/auth/*` і `/api/v1/admin/*`

## DB
Postgres 16
Indexes: events(ts), events(phrase_id), events(platform), events(anon_hash), users(nickname)
Міграції: golang-migrate (SQL файли)

## Аналітика
Materialized view daily_phrase_stats
Cron оновлення кожні 15 хв

## Seed фраз
CLI команда `make seed` — імпорт з docs/PHRASES.md в БД при деплої

## WebSocket
/ws/v1/leaderboard — real-time топ гравців, auth по anon_hash або JWT

## Конфіг
cleanenv — структурований .env

## Логування
zerolog JSON

## Makefile цілі
run, build, test, migrate, migrate-down, seed, docker-build, docker-up, docker-down

## Docker Compose
postgres + backend
