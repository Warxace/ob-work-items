#!/usr/bin/env node
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Serve bundled UI from ../../ui/dist (relative to this file in dist/)
const uiDist = path.resolve(__dirname, '../../ui/dist');

app.use(
  '/*',
  serveStatic({ root: uiDist }),
);

// SPA fallback: any non-API route returns index.html
app.get('*', async (c) => {
  const indexPath = path.join(uiDist, 'index.html');
  try {
    const { readFile } = await import('fs/promises');
    const html = await readFile(indexPath, 'utf8');
    return c.html(html);
  } catch {
    return c.text('UI not found. Run: npm run build -w @warxace/ob-wi-ui', 404);
  }
});

serve({ fetch: app.fetch, port }, () => {
  console.log(`ob-wi-serve listening on http://localhost:${port}`);
  console.log(`  work-items: ${repoPath}`);
  console.log(`  open: http://localhost:${port}`);
});
