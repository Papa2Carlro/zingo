#!/bin/bash
# ZINGO Deployment Helper Script

set -e

echo "🚀 ZINGO Deployment Helper"
echo "=========================="

case "${1:-help}" in
  "admin-tool")
    echo "📦 Setting up Admin Tool..."
    cd admin-tool
    npm install
    echo "✅ Admin tool ready!"
    echo ""
    echo "Usage:"
    echo "  DATABASE_URL=postgresql://... npm run db:push    # Run migrations"
    echo "  DATABASE_URL=postgresql://... npm run seed:parse # Seed from PHRASES.md"
    echo "  DATABASE_URL=postgresql://... npm run admin      # Interactive admin"
    ;;
    
  "worker-api")
    echo "☁️  Setting up Cloudflare Worker API..."
    cd worker-api
    npm install
    echo "✅ Worker API ready!"
    echo ""
    echo "Setup:"
    echo "  1. npm run db:create                    # Create D1 database"
    echo "  2. Update wrangler.toml with database_id"
    echo "  3. npm run db:migrate                   # Run migrations locally"
    echo "  4. npm run db:seed                      # Seed phrases locally"
    echo "  5. npm run dev                          # Test locally"
    echo "  6. npm run db:migrate:prod              # Run migrations on prod"
    echo "  7. npm run db:seed:prod                 # Seed phrases on prod"
    echo "  8. npm run deploy                       # Deploy to Cloudflare"
    ;;
    
  "fly")
    echo "🪰 Setting up Fly.io deployment..."
    cd backend
    echo "✅ Fly.io config ready (fly.toml)!"
    echo ""
    echo "Setup:"
    echo "  1. fly auth login                       # Login to Fly.io"
    echo "  2. fly postgres create --name zingo-db  # Create PostgreSQL"
    echo "  3. fly postgres attach zingo-db         # Attach to app"
    echo "  4. fly redis create --name zingo-redis  # Create Redis"
    echo "  5. fly redis attach zingo-redis         # Attach to app"
    echo "  6. fly secrets set JWT_SECRET=...       # Set secrets"
    echo "  7. fly deploy                           # Deploy!"
    ;;
    
  "extension")
    echo "🧩 Building Extension..."
    cd extension
    npm run build
    npm run zip
    echo "✅ Extension built and zipped!"
    echo "   Output: .output/zingo-extension-0.1.0-chrome.zip"
    ;;
    
  "all")
    echo "🔨 Building everything..."
    $0 extension
    $0 admin-tool
    $0 worker-api
    echo "✅ All components ready!"
    ;;
    
  *)
    echo "Usage: ./deploy.sh [admin-tool|worker-api|fly|extension|all]"
    echo ""
    echo "Components:"
    echo "  admin-tool   - Node.js CLI for database management"
    echo "  worker-api   - Cloudflare Workers + D1 API (TypeScript)"
    echo "  fly          - Fly.io deployment for Go backend"
    echo "  extension    - Chrome extension (WXT)"
    echo "  all          - Build all components"
    ;;
esac