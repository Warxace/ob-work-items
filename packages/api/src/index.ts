#!/usr/bin/env node
import { serve } from '@hono/node-server';
import { createApp } from './app.js';

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        result[key] = next;
        i++;
      }
    }
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));
const repoPath = args['path'] ?? process.env['WI_PATH'];
const port = Number(args['port'] ?? process.env['WI_PORT'] ?? 3847);

if (!repoPath) {
  console.error('Usage: ob-wi-serve --path /path/to/work-items [--port 3847]');
  process.exit(1);
}

const app = createApp({ repoPath });

serve({ fetch: app.fetch, port }, () => {
  console.log(`ob-wi-api listening on http://localhost:${port}`);
  console.log(`  work-items: ${repoPath}`);
});
