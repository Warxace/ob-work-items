#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { createServer } from './server.js';
import { createGit } from './git/git.js';
import { onStartup, startPeriodicSync } from './git/sync.js';
import { createRequire } from 'module';

// Handle --version flag before anything else
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  const require = createRequire(import.meta.url);
  const pkg = require('../package.json') as { version: string };
  console.log(pkg.version);
  process.exit(0);
}

async function main() {
  const config = loadConfig();
  const git = createGit(config.workItemsPath);

  // Pull latest state on startup
  await onStartup(git);

  // Start periodic push if configured
  const stopSync = startPeriodicSync(git, config);

  const server = createServer(config, git);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error(`[ob-wi-mcp] server started, work-items: ${config.workItemsPath}`);

  // Cleanup on exit
  process.on('SIGINT', () => {
    stopSync();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    stopSync();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[ob-wi-mcp] fatal error:', err);
  process.exit(1);
});
