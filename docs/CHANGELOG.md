# Changelog

## 2026-08-17 — MVP+ Planning Complete

### Документація
- Додано CHANGELOG.md
- Додано CONTRIBUTING.md
- Додано CODE_OF_CONDUCT.md
- Оновлено ROADMAP.md з актуальним статусом
- Створено docs/planning структуру

### Backend
- Ініціалізовано Go scaffolding Gin + GORM
- Структура internal/handler/service/repo/model
- Middleware: CORS, RateLimit, Auth, AdminOnly
- Endpoints v1 публічні та адмін
- WebSocket /ws/v1/leaderboard заглушка
- Docker compose postgres + backend

### Плагін WXT
- Планування структури entrypoints
- IndexedDB схема визначена
- Алгоритми generator/matcher/speech описані

### Аналітика
- anon_hash схема підтверджена
- Rate limit 100/1000 req/min
- Materialized view daily_phrase_stats план

## 2026-08-16 — MVP Core

### Документація
- SPEC.md завершено
- ARCHITECTURE.md завершено
- TECH.md завершено
- ADR 0007 прийнято

### Дизайн
- UI дизайн 5x5 Bingo в Shadow DOM
- Темна тема за замовчуванням
- Toast підтвердження для автодетекту

## 2026-08-15 — Ініціалізація

### Документація
- Початкова база фраз PHRASES.md
- Категорії: propaganda, meme, creepy, standard
- Ваги 1-10

### Архітектура
- Гібрид MV3 + Backend обрано
- WXT для плагіна
- Go для backend
- IndexedDB кеш + sync
