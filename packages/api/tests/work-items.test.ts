/**
 * Integration tests for the work-items HTTP API.
 * Tests run against an in-memory Hono app with a real tmp repo on disk.
 * Git operations are NOT invoked (no remote, no commit in tests).
 */
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { createWorkItem, defaultSchemaYaml } from '@warxace/ob-wi-core';
import { createApp } from '../src/app.js';

let tmpDir: string;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-api-test-'));
  await fs.mkdir(path.join(tmpDir, '.schema'), { recursive: true });
  await fs.writeFile(
    path.join(tmpDir, '.schema', 'types.yaml'),
    defaultSchemaYaml(),
    'utf8',
  );
  app = createApp({ repoPath: tmpDir });
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// ─── helpers ─────────────────────────────────────────────────────────────────

async function seed() {
  const t1 = new Date('2026-01-01T10:00:00Z');
  const t2 = new Date('2026-01-02T10:00:00Z');
  const t3 = new Date('2026-01-03T10:00:00Z');

  const a = await createWorkItem(tmpDir, {
    type: 'task',
    status: 'open',
    priority: 'high',
    title: 'Alpha task',
    body: 'alpha body',
    tags: ['backend'],
    links: [],
  }, t1);

  const b = await createWorkItem(tmpDir, {
    type: 'issue',
    status: 'open',
    priority: 'medium',
    title: 'Beta issue',
    body: 'beta body',
    tags: ['frontend'],
    links: [],
  }, t2);

  const c = await createWorkItem(tmpDir, {
    type: 'task',
    status: 'done',
    priority: 'low',
    title: 'Gamma done',
    body: 'gamma body',
    tags: ['backend'],
    links: [],
  }, t3);

  return { a, b, c };
}

async function req(
  method: string,
  url: string,
  body?: unknown,
): Promise<Response> {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return app.request(url, init);
}

// ─── GET /api/items ───────────────────────────────────────────────────────────

describe('GET /api/items', () => {
  it('returns all items with total when no filters', async () => {
    const { a, b, c } = await seed();
    const res = await req('GET', '/api/items');
    expect(res.status).toBe(200);
    const json = await res.json() as { items: unknown[]; total: number };
    expect(json.total).toBe(3);
    const ids = (json.items as { id: string }[]).map((i) => i.id);
    expect(ids).toContain(a.id);
    expect(ids).toContain(b.id);
    expect(ids).toContain(c.id);
  });

  it('filters by type', async () => {
    await seed();
    const res = await req('GET', '/api/items?type=task');
    const json = await res.json() as { items: unknown[]; total: number };
    expect(json.total).toBe(2);
    (json.items as { type: string }[]).forEach((i) => expect(i.type).toBe('task'));
  });

  it('filters by status', async () => {
    await seed();
    const res = await req('GET', '/api/items?status=done');
    const json = await res.json() as { items: unknown[]; total: number };
    expect(json.total).toBe(1);
    expect((json.items as { status: string }[])[0].status).toBe('done');
  });

  it('filters by priority', async () => {
    await seed();
    const res = await req('GET', '/api/items?priority=high');
    const json = await res.json() as { items: unknown[]; total: number };
    expect(json.total).toBe(1);
    expect((json.items as { priority: string }[])[0].priority).toBe('high');
  });

  it('filters by tags', async () => {
    await seed();
    const res = await req('GET', '/api/items?tags=backend');
    const json = await res.json() as { items: unknown[]; total: number };
    expect(json.total).toBe(2);
    (json.items as { tags: string[] }[]).forEach((i) => expect(i.tags).toContain('backend'));
  });

  it('full-text search with q', async () => {
    await seed();
    const res = await req('GET', '/api/items?q=alpha');
    const json = await res.json() as { items: unknown[]; total: number };
    expect(json.total).toBe(1);
    expect((json.items as { title: string }[])[0].title).toBe('Alpha task');
  });

  it('sorts by title ascending', async () => {
    await seed();
    const res = await req('GET', '/api/items?sort=title&order=asc');
    const json = await res.json() as { items: { title: string }[] };
    const titles = json.items.map((i) => i.title);
    expect(titles).toEqual([...titles].sort());
  });

  it('sorts by title descending', async () => {
    await seed();
    const res = await req('GET', '/api/items?sort=title&order=desc');
    const json = await res.json() as { items: { title: string }[] };
    const titles = json.items.map((i) => i.title);
    expect(titles).toEqual([...titles].sort().reverse());
  });

  it('returns empty list when no items match', async () => {
    await seed();
    const res = await req('GET', '/api/items?type=decision');
    const json = await res.json() as { items: unknown[]; total: number };
    expect(json.total).toBe(0);
    expect(json.items).toEqual([]);
  });
});

// ─── GET /api/items/:id ───────────────────────────────────────────────────────

describe('GET /api/items/:id', () => {
  it('returns a single item by ID', async () => {
    const { a } = await seed();
    const res = await req('GET', `/api/items/${a.id}`);
    expect(res.status).toBe(200);
    const json = await res.json() as { id: string; title: string };
    expect(json.id).toBe(a.id);
    expect(json.title).toBe('Alpha task');
  });

  it('returns 404 for unknown ID', async () => {
    const res = await req('GET', '/api/items/20000101-ffff');
    expect(res.status).toBe(404);
  });
});

// ─── PATCH /api/items/:id ─────────────────────────────────────────────────────

describe('PATCH /api/items/:id', () => {
  it('updates status', async () => {
    const { a } = await seed();
    const res = await req('PATCH', `/api/items/${a.id}`, { status: 'done' });
    expect(res.status).toBe(200);
    const json = await res.json() as { status: string };
    expect(json.status).toBe('done');
  });

  it('updates tags', async () => {
    const { a } = await seed();
    const res = await req('PATCH', `/api/items/${a.id}`, { tags: ['infra', 'ci'] });
    expect(res.status).toBe(200);
    const json = await res.json() as { tags: string[] };
    expect(json.tags).toEqual(['infra', 'ci']);
  });

  it('returns 404 for unknown ID', async () => {
    const res = await req('PATCH', '/api/items/20000101-ffff', { status: 'done' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid status value', async () => {
    const { a } = await seed();
    const res = await req('PATCH', `/api/items/${a.id}`, { status: 'flying' });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/meta/tags ───────────────────────────────────────────────────────

describe('GET /api/meta/tags', () => {
  it('returns all unique tags sorted', async () => {
    await seed();
    const res = await req('GET', '/api/meta/tags');
    expect(res.status).toBe(200);
    const json = await res.json() as string[];
    expect(json).toContain('backend');
    expect(json).toContain('frontend');
    // no duplicates
    expect(new Set(json).size).toBe(json.length);
  });
});

// ─── GET /api/meta/stats ──────────────────────────────────────────────────────

describe('GET /api/meta/stats', () => {
  it('returns counts by type, status, priority', async () => {
    await seed();
    const res = await req('GET', '/api/meta/stats');
    expect(res.status).toBe(200);
    const json = await res.json() as {
      byType: Record<string, number>;
      byStatus: Record<string, number>;
      byPriority: Record<string, number>;
    };
    expect(json.byType['task']).toBe(2);
    expect(json.byType['issue']).toBe(1);
    expect(json.byStatus['open']).toBe(2);
    expect(json.byStatus['done']).toBe(1);
    expect(json.byPriority['high']).toBe(1);
  });
});
