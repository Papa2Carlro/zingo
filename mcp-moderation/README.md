# ZINGO Moderation MCP

MCP (Model Context Protocol) server for ZINGO phrase moderation workflow.

## Tools

- **evaluate_phrase** - AI evaluates a phrase, suggests category/weight
- **approve_phrase** - Approve and add phrase to database
- **reject_phrase** - Reject phrase with reason
- **get_moderation_log** - View moderation history
- **list_phrases** - List phrases with filters

## Setup

```bash
cd mcp-moderation
npm install
npm run build
```

## Usage with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zingo-moderation": {
      "command": "node",
      "args": ["/path/to/zingo/mcp-moderation/dist/index.js"],
      "env": {
        "ZINGO_WORKER_API_URL": "https://your-worker.your-subdomain.workers.dev"
      }
    }
  }
}
```

## Usage Example

```
User: "Оцініть фразу: А где вы были 8 лет"

Claude: [calls evaluate_phrase]
Result: {
  "evaluation": {
    "approved": true,
    "category": "propaganda",
    "weight": 8,
    "reasoning": "Contains propaganda-related keywords",
    "suggested_variants": ["а где вы были 8 лет", "а где вы были 8 лет"]
  }
}

User: "Ок, схвалюй з категорією propaganda і вагою 8"

Claude: [calls approve_phrase]
Result: { "phrase": { "id": 42, "text": "а где вы были 8 лет", ... }, "success": true }
```

## Workflow

1. **User submits phrase** → `evaluate_phrase`
2. **AI returns evaluation** with category, weight, reasoning
3. **User reviews** and decides to approve/reject
4. **If approve** → `approve_phrase` with confirmed params
5. **If reject** → `reject_phrase` with reason
6. **All actions logged** in moderation_log table

## Environment Variables

- `ZINGO_WORKER_API_URL` - Your deployed Worker API URL (default: http://localhost:8787)