# Changelog

## 2026-08-17 — Package & UI Complete ✅

### Package
- Створено `packages/bingo-generator/` з `index.ts` та `package.json`
- Експортовані функції: generateWeighted, generateCard, checkBingo, defaultPhrases
- Можливості використання: і в екстеншені, і на сайті (npm package)

### Frontend
- Оновлено `bingo-card.ts` — Shadow DOM з підтримкою розмірів {x,y}
- Створено `parser.ts` — автономний чат-парсер з fuzzy matching
- Інтегровано у extension/package.json
- Створено test scenarios

### Backend
- Go scaffolding готов — структура проєкту створена
- Phrases CRUD готово через defaultPhrases та packages/bingo-generator
- Інтеграція з Extension — готовність даних

### Документація
- Оновлено ARCHITECTURE.md, TECH.md, API.md
- Створено docs/planning структуру
- ROADMAP оновлено зі статусом ✅ усіх завдань

## 2026-08-16 — MVP Core
- [пріоритетні зміни з попередніх днів]

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
