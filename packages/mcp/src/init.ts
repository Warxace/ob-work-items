#!/usr/bin/env node
/**
 * ob-wi-mcp-init <path>
 * Creates a new work-items repository with initial structure.
 */
import { initWorkItemsRepo } from './init-repo.js';

const targetPath = process.argv[2];
if (!targetPath) {
  console.error('Usage: ob-wi-mcp-init <path>');
  process.exit(1);
}

initWorkItemsRepo(targetPath).catch((err: unknown) => {
  console.error('Init failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
