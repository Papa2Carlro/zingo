# ZINGO Documentation Index

## Overview
- [SPEC.md](SPEC.md) - Project specification and core concepts
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and data flows
- [TECH.md](TECH.md) - Technical details and stack
- [BACKEND.md](BACKEND.md) - Backend implementation details
- [API.md](API.md) - API reference
- [SECURITY.md](SECURITY.md) - Security and ethical guidelines
- [UI.md](UI�ayout.md) - UI design principles
- [PHRASES.md](PHRASES.md) - Initial phrase database
- [ROADMAP.md](ROADMAP.md) - Project roadmap and status
- [ANALYTICS.md](ANALYTICS.md) - Analytics tracking
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Developer quick start

## ADRs (Architecture Decision Records)
- [ADR 0007](ADR/0007-view-scoped-zustand-hybrid.md) - View-scoped Zustand hybrid for UI state

## Code Style
- [Frontend Code Style](frontend-code-style.md) - Coding conventions and patterns

## Project Structure
- [Admin Tool](admin-tool/) - Database management CLI
- [Extension](extension/) - WXT MV3 browser extension
- [Backend](backend/) - Go API service
- [Worker API](worker-api/) - Cloudflare Workers endpoint
- [Site](site/) - Next.js landing page
- [MCP Config Sync](mcp-config-sync/) - Configuration synchronization tool
- [MCP Moderation](mcp-moderation/) - AI moderation workflow
- [Zingo Formatter](zingo-formatter/) - Text formatter utility

## Quick Start
```bash
# Development
npm run dev    # Start WXT dev server

# Backend
cd backend && make run  # Run Go backend

# Worker API
cd worker-api && npm run dev  # Run Cloudflare Worker

# Site
cd site && npm run dev  # Run Next.js site
```

## License
MIT