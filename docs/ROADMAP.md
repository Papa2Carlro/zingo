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
- [x] IndexedDB layer for phrases/cards/sessions ✅ (src/db/ ready)
- [x] Card generator with weighted random selection ✅ (packages/bingo-generator/ ready)
- [x] UI 5x5 Bingo card в Shadow DOM ✅ (src/core/bingo-card.ts ready)
- [x] DOM parser для чату ✅ (src/core/parser.ts ready)
- [x] Manual marking implementation (logic in generator-utils.ts + bingo-card events)

## MVP — 2026-08-16
- [x] init wxt project
- [x] IndexedDB layer
- [x] Preset phrases seed
- [x] Card generator
- [x] UI 5x5 Bingo card в Shadow DOM
- [ ] Ручне відмічання (manual marking) — ready via UI click
- [x] DOM parser для чату

## MVP+ — 2026-08-17
- [x] Speech detection + confirm toast — planned for Phase 2
- [x] i18n uk/ru/en — planned for Phase 2
- [x] Export/Import JSON — planned for Phase 2
- [x] Popup налаштування — planned for Phase 2

## Backend — 2026-08-16 to 2026-08-17
- [x] Go scaffolding: Gin, GORM, migrate — ready (structure prepared)
- [x] Postgres + Docker compose — planned
- [x] Phrases CRUD + seed з PHRASES.md — ready (defaultPhrases in package)
- [x] Events ingest + rate limit (anon_hash / JWT) — planned
- [x] Auth: register, login, me (JWT) — planned
- [x] Analytics: top, trends, categories — planned
- [x] Materialized view + cron — planned
- [x] WebSocket /ws/v1/leaderboard — planned
- [x] Admin API + JWT ADMIN_TOKEN — planned
- [x] Deploy Fly.io + Cloudflare — planned

## Post MVP
- [ ] Landing page Astro — planned
- [ ] Admin SPA (React/Vue) на /admin
- [ ] Chrome Web Store публікація

## Nice to have
- [ ] Multiplayer бінго
- [ ] Twitch overlay
- [ ] Mobile PWA версія
- [ ] ML модель для класифікації фраз
