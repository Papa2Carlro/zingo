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

## Endpoints — Публічні
GET  /api/phrases
POST /api/events
GET  /api/analytics/top?period=day|week|month
GET  /api/analytics/trends
GET  /api/analytics/categories

## Endpoints — Адмінка (окремий SPA на /admin)
GET  /api/admin/phrases
POST /api/admin/phrases
PATCH /api/admin/phrases/:id
DELETE /api/admin/phrases/:id
GET  /api/admin/stats

## Auth
- Публічні ендпоїнти: rate limit по anon_hash (IP hash)
- Адмінка: проста Basic Auth або JWT з env ADMIN_TOKEN

## Rate Limiting
- middleware: 100 req/min на anon_hash
- Cloudflare WAF правила

## DB
Postgres 16
Indexes: events(ts), events(phrase_id), events(platform), events(anon_hash)
Міграції: golang-migrate

## Аналітика
Materialized view daily_phrase_stats
Cron оновлення кожні 15 хв

## Seed фраз
CLI команда `make seed` — імпорт з docs/PHRASES.md в БД при деплої

## WebSocket
/ws/leaderboard — real-time топ гравців
