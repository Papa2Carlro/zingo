# ZINGO Worker API

Cloudflare Workers + D1 (SQLite) version of the ZINGO API.

## Quick Start

```bash
cd worker-api
npm install

# Create D1 database
npm run db:create
# Update wrangler.toml with the database_id from output

# Run migrations locally
npm run db:migrate

# Seed phrases
npm run db:seed

# Start dev server
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/v1/phrases` - List phrases (with filters)
- `GET /api/v1/phrases/:id` - Get phrase
- `POST /api/v1/phrases` - Create phrase (admin)
- `PUT /api/v1/phrases/:id` - Update phrase (admin)
- `DELETE /api/v1/phrases/:id` - Delete phrase (admin)
- `POST /api/v1/events` - Ingest event
- `GET /api/v1/analytics/top` - Top phrases
- `GET /api/v1/analytics/categories` - Category stats
- `GET /ws/v1/leaderboard` - WebSocket (stub)

## Database

Uses Cloudflare D1 (SQLite). Migrations in `migrations/`, seed data in `seed.sql`.

## Deployment

1. Create D1 database: `wrangler d1 create zingo-db`
2. Update `wrangler.toml` with `database_id`
3. Run migrations: `wrangler d1 migrations apply zingo-db --remote`
4. Seed: `wrangler d1 execute zingo-db --remote --file=./seed.sql`
5. Deploy: `wrangler deploy`

## Extension Config

Update extension `apiBaseUrl` to your worker URL:
`https://zingo-api.your-subdomain.workers.dev`