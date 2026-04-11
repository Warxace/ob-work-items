import { Hono } from 'hono';
import { z } from 'zod';
import {
  listWorkItems,
  searchWorkItems,
  getWorkItem,
  updateWorkItem,
  type WorkItem,
  type WorkItemFilter,
} from '@warxace/ob-wi-core';
import type { AppConfig } from '../app.js';

const PatchSchema = z.object({
  status: z.enum(['open', 'in-progress', 'blocked', 'done', 'cancelled']).optional(),
  tags: z.array(z.string()).optional(),
});

type SortField = keyof Pick<WorkItem, 'title' | 'created' | 'updated' | 'priority' | 'status' | 'type'>;
const SORT_FIELDS = new Set<string>(['title', 'created', 'updated', 'priority', 'status', 'type']);

/** Priority rank for sorting (lower = higher priority). */
const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function sortItems(items: WorkItem[], sort: string, order: string): WorkItem[] {
  if (!SORT_FIELDS.has(sort)) return items;
  const field = sort as SortField;
  const asc = order !== 'desc';

  return [...items].sort((a, b) => {
    let av: string | number = a[field] as string;
    let bv: string | number = b[field] as string;

    if (field === 'priority') {
      av = PRIORITY_RANK[a.priority] ?? 99;
      bv = PRIORITY_RANK[b.priority] ?? 99;
    }

    if (av < bv) return asc ? -1 : 1;
    if (av > bv) return asc ? 1 : -1;
    return 0;
  });
}

/**
 * Routes for /api/items.
 *
 * GET  /              — list with optional filters + sort
 * GET  /:id           — single item
 * PATCH /:id          — update status and/or tags
 */
export function workItemsRoutes(config: AppConfig): Hono {
  const app = new Hono();

  // GET /api/items
  app.get('/', async (c) => {
    const q = c.req.query();

    // Build filter
    const filter: WorkItemFilter = {};
    if (q['type']) filter.type = q['type'] as WorkItemFilter['type'];
    if (q['status']) filter.status = q['status'] as WorkItemFilter['status'];
    if (q['priority']) filter.priority = q['priority'] as WorkItemFilter['priority'];
    if (q['tags']) filter.tags = q['tags'].split(',').map((t) => t.trim()).filter(Boolean);
    if (q['agent']) filter.agent = q['agent'];
    if (q['machine']) filter.machine = q['machine'];

    // Fetch — use search if q param provided, otherwise list with filter
    let items: WorkItem[];
    if (q['q'] && q['q'].trim()) {
      const searched = await searchWorkItems(config.repoPath, q['q'].trim());
      // Apply structural filters on top of search results
      items = searched.filter((item) => {
        if (filter.type && item.type !== filter.type) return false;
        if (filter.status && item.status !== filter.status) return false;
        if (filter.priority && item.priority !== filter.priority) return false;
        if (filter.agent && item.source?.agent !== filter.agent) return false;
        if (filter.machine && item.source?.machine !== filter.machine) return false;
        if (filter.tags && filter.tags.length > 0) {
          const itemTags = item.tags ?? [];
          if (!filter.tags.every((t) => itemTags.includes(t))) return false;
        }
        return true;
      });
    } else {
      items = await listWorkItems(config.repoPath, filter);
    }

    // Sort
    const sort = q['sort'] ?? 'created';
    const order = q['order'] ?? 'asc';
    items = sortItems(items, sort, order);

    return c.json({ items, total: items.length });
  });

  // GET /api/items/:id
  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    try {
      const item = await getWorkItem(config.repoPath, id);
      return c.json(item);
    } catch {
      return c.json({ error: 'Not found' }, 404);
    }
  });

  // PATCH /api/items/:id
  app.patch('/:id', async (c) => {
    const id = c.req.param('id');

    // Validate body
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    // Check item exists
    try {
      await getWorkItem(config.repoPath, id);
    } catch {
      return c.json({ error: 'Not found' }, 404);
    }

    const updated = await updateWorkItem(config.repoPath, id, parsed.data);
    return c.json(updated);
  });

  return app;
}
