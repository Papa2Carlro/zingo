import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

const WORKER_API_URL = process.env.ZINGO_WORKER_API_URL || 'http://localhost:8787';

const server = new Server(
  {
    name: 'zingo-moderation',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools: Tool[] = [
  {
    name: 'evaluate_phrase',
    description: 'Evaluate a phrase for ZINGO bingo - AI analyzes if it fits propaganda/meme/creepy/standard category and suggests weight',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The phrase text to evaluate' },
        lang: { type: 'string', description: 'Language code (ru/uk/en)', default: 'ru' },
      },
      required: ['text'],
    },
  },
  {
    name: 'approve_phrase',
    description: 'Approve and add a phrase to the ZINGO database after evaluation',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The phrase text' },
        category: { type: 'string', enum: ['propaganda', 'meme', 'creepy', 'standard'] },
        weight: { type: 'number', minimum: 1, maximum: 10 },
        lang: { type: 'string', default: 'ru' },
        variants: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        moderator_note: { type: 'string' },
      },
      required: ['text', 'category', 'weight'],
    },
  },
  {
    name: 'reject_phrase',
    description: 'Reject a phrase and log the reason',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['text', 'reason'],
    },
  },
  {
    name: 'get_moderation_log',
    description: 'Get moderation history log',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 50 },
      },
    },
  },
  {
    name: 'list_phrases',
    description: 'List phrases from database with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['propaganda', 'meme', 'creepy', 'standard'] },
        lang: { type: 'string' },
        limit: { type: 'number', default: 50 },
      },
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'evaluate_phrase': {
        const { text, lang = 'ru' } = args as { text: string; lang?: string };
        const response = await fetch(`${WORKER_API_URL}/api/v1/moderation/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, lang }),
        });
        const data = await response.json();
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      
      case 'approve_phrase': {
        const data = args as {
          text: string;
          category: string;
          weight: number;
          lang?: string;
          variants?: string[];
          tags?: string[];
          moderator_note?: string;
        };
        const response = await fetch(`${WORKER_API_URL}/api/v1/moderation/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
      
      case 'reject_phrase': {
        const { text, reason } = args as { text: string; reason: string };
        const response = await fetch(`${WORKER_API_URL}/api/v1/moderation/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, reason }),
        });
        const result = await response.json();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
      
      case 'get_moderation_log': {
        const { limit = 50 } = args as { limit?: number };
        const response = await fetch(`${WORKER_API_URL}/api/v1/moderation/log?limit=${limit}`);
        const data = await response.json();
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      
      case 'list_phrases': {
        const { category, lang, limit = 50 } = args as { category?: string; lang?: string; limit?: number };
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (lang) params.append('lang', lang);
        params.append('limit', limit.toString());
        
        const response = await fetch(`${WORKER_API_URL}/api/v1/phrases?${params}`);
        const data = await response.json();
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ZINGO Moderation MCP server running on stdio');
}

main().catch(console.error);