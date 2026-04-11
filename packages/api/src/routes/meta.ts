import { Hono } from 'hono';
import { listWorkItems } from '@warxace/ob-wi-core';
import type { AppConfig } from '../app.js';

/**
 * Routes for /api/meta.
 *
 * GET /tags   — all unique tags sorted alphabetically
 * GET /stats  — item counts grouped by type, status, and priority
 */
export function metaRoutes(config: AppConfig): Hono {
  const app = new Hono();

  // GET /api/meta/tags
  app.get('/tags', async (c) => {
    const items = await listWorkItems(config.repoPath);
    const tagSet = new Set<string>();
    for (const item of items) {
      for (const tag of item.tags ?? []) {
        tagSet.add(tag);
      }
    }
    return c.json([...tagSet].sort());
  });

  // GET /api/meta/stats
  app.get('/stats', async (c) => {
    const items = await listWorkItems(config.repoPath);

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const item of items) {
      byType[item.type] = (byType[item.type] ?? 0) + 1;
      byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
      byPriority[item.priority] = (byPriority[item.priority] ?? 0) + 1;
    }

    return c.json({ byType, byStatus, byPriority });
  });

  return app;
}
