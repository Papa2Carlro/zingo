# Contributing to ZINGO

## Як допомогти

ZINGO — open source fan project. Ми вітаємо PR, issues, пропозиції фраз.

## Development Setup

### Плагін WXT
```bash
cd extension
npm install
npm run dev
```

### Backend Go
```bash
cd backend
make run
```

### Локальний Postgres
```bash
docker compose up -d postgres
make migrate
make seed
```

## Code Style

- Frontend: SCSS modules + BEM, Prettier semi:false tabWidth:2
- WXT: TypeScript strict
- Go: go fmt, go vet, golangci-lint

## ADR Process

Нові архітектурні рішення — через ADR в docs/. Стандартний шаблон ADR 0007.

## Додавання фраз

1. Відкрий docs/PHRASES.md
2. Додай фразу з вагою 1-10 та категорією
3. Нормалізація: нижній регістр, видалити пунктуацію
4. PR з описом категорії та контексту

## PR Checklist

- [ ] Документація оновлена
- [ ] Тести проходять
- [ ] Prettier/Formatter застосовано
- [ ] CHANGELOG оновлено

## License
MIT
