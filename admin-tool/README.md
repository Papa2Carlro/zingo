# ZINGO Admin Tool

Simple CLI tool for managing ZINGO database - seeding phrases, running migrations, interactive admin.

## Setup

```bash
cd admin-tool
npm install
```

## Usage

### 1. Run migrations (create tables)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname npm run db:push
```

### 2. Seed phrases from PHRASES.md
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname npm run seed:parse
```

### 3. Interactive admin mode
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname npm run admin
```

## Commands in interactive mode

- `list [category]` - List all phrases (optionally filter by category)
- `add` - Add new phrase (prompts for details)
- `delete <id>` - Soft delete phrase by ID
- `stats` - Show database statistics
- `help` - Show help
- `exit` - Quit

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `NODE_ENV=production` - Enable SSL for production databases

## Examples

```bash
# Local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zingo npm run db:push
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zingo npm run seed:parse

# Production (Fly.io, Railway, etc.)
DATABASE_URL=postgresql://user:pass@host:5432/dbname npm run seed:parse

# Cloudflare Hyperdrive
DATABASE_URL=postgresql://user:pass@hyperdrive-host:5432/dbname npm run seed:parse
```