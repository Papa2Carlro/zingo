# Roadmap

## Done
- [x] SPEC
- [x] PHRASES
- [x] ARCHITECTURE
- [x] TECH
- [x] ADR 0007 — View-scoped Zustand hybrid
- [x] CHANGELOG.md
- [x] CONTRIBUTING.md
- [x] CODE_OF_CONDUCT.md

## In Progress
- [x] Scaffolding WXT (backend + frontend structure) — docs complete
- [x] Go backend scaffolding — cmd/api/main.go ready
- [ ] IndexedDB layer for phrases/cards/sessions
- [ ] Card generator with weighted random selection
- [ ] UI 5x5 Bingo card в Shadow DOM
- [ ] Ручне відмічання
- [ ] DOM parser для чату

## MVP — 2026-08-16
- [ ] init wxt project
- [ ] IndexedDB layer
- [ ] Preset phrases seed
- [ ] Card generator
- [ ] UI 5x5 Bingo card в Shadow DOM
- [ ] Ручне відмічання
- [ ] DOM parser для чату

## MVP+ — 2026-08-17
- [ ] Speech deteck + confirm toast
- [ ] i18n uk/ru/en
- [ ] Export/Import JSON
- [ ] Popup налаштування

## Backend — 2026-08-16 to 2026-08-17
- [ ] Go scaffolding: Gin, GORM, migrate
- [ ] Postgres + Docker compose
- [ ] Phrases CRUD + seed з PHRASES.md
- [ ] Events ingest + rate limit (anon_hash / JWT)
- [ ] Auth: register, login, me (JWT)
- [ ] Analytics: top, trends, categories
- [ ] Materialized view + cron
- [ ] WebSocket /ws/v1/leaderboard
- [ ] Admin API + JWT ADMIN_TOKEN
- [ ] Deploy Fly.io + Cloudflare

## Post MVP
- [ ] Landing page Astro
- [ ] Admin SPA (React/Vue) на /admin
- [ ] Chrome Web Store публікація

## Nice to have
- [ ] Multiplayer бінго
- [ ] Twitch overlay
- [ ] Mobile PWA версія
- [ ] ML модель для класифікації фраз
