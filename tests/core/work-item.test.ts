import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  createWorkItem,
  getWorkItem,
  updateWorkItem,
  listWorkItems,
  searchWorkItems,
  parseWorkItem,
  serializeWorkItem,
} from '../../src/core/work-item.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('parseWorkItem / serializeWorkItem', () => {
  it('round-trips a work item', () => {
    const item = {
      id: '20260321-a3f8',
      type: 'task' as const,
      status: 'open' as const,
      priority: 'medium' as const,
      title: 'Test task',
      body: 'Some body text',
      created: '2026-03-21T10:00:00.000Z',
      updated: '2026-03-21T10:00:00.000Z',
      tags: ['backend'],
      links: [],
    };
    const serialized = serializeWorkItem(item);
    const parsed = parseWorkItem(item.id, serialized);
    expect(parsed.id).toBe(item.id);
    expect(parsed.type).toBe(item.type);
    expect(parsed.status).toBe(item.status);
    expect(parsed.title).toBe(item.title);
    expect(parsed.body).toBe(item.body);
    expect(parsed.tags).toEqual(item.tags);
  });
});

describe('createWorkItem', () => {
  it('creates a file and returns the work item', async () => {
    const now = new Date('2026-03-21T10:00:00Z');
    const item = await createWorkItem(
      tmpDir,
      {
        type: 'task',
        status: 'open',
        priority: 'medium',
        title: 'My first task',
        body: 'Details here',
        tags: [],
        links: [],
      },
      now,
    );

    expect(item.id).toMatch(/^20260321-[0-9a-f]{4}$/);
    expect(item.title).toBe('My first task');

    const files = await fs.readdir(tmpDir);
    expect(files).toContain(`WI-${item.id}.md`);
  });
});

describe('getWorkItem', () => {
  it('reads back a created work item', async () => {
    const now = new Date('2026-03-21T10:00:00Z');
    const created = await createWorkItem(
      tmpDir,
      { type: 'issue', status: 'open', priority: 'high', title: 'Bug', body: 'It crashes', tags: [], links: [] },
      now,
    );
    const fetched = await getWorkItem(tmpDir, created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe('Bug');
    expect(fetched.body).toBe('It crashes');
  });

  it('throws for unknown ID', async () => {
    await expect(getWorkItem(tmpDir, '20260101-ffff')).rejects.toThrow();
  });
});

describe('updateWorkItem', () => {
  it('updates status and body', async () => {
    const now = new Date('2026-03-21T10:00:00Z');
    const created = await createWorkItem(
      tmpDir,
      { type: 'task', status: 'open', priority: 'low', title: 'Todo', body: '', tags: [], links: [] },
      now,
    );

    const later = new Date('2026-03-21T11:00:00Z');
    const updated = await updateWorkItem(tmpDir, created.id, { status: 'done', body: 'Done!' }, later);

    expect(updated.status).toBe('done');
    expect(updated.body).toBe('Done!');
    expect(updated.updated).toBe(later.toISOString());
    expect(updated.created).toBe(created.created); // unchanged
  });
});

describe('listWorkItems', () => {
  it('returns all items sorted by created', async () => {
    const t1 = new Date('2026-03-21T10:00:00Z');
    const t2 = new Date('2026-03-21T11:00:00Z');
    const a = await createWorkItem(tmpDir, { type: 'task', status: 'open', priority: 'low', title: 'A', body: '', tags: [], links: [] }, t1);
    const b = await createWorkItem(tmpDir, { type: 'issue', status: 'open', priority: 'high', title: 'B', body: '', tags: [], links: [] }, t2);

    const list = await listWorkItems(tmpDir);
    expect(list.map((i) => i.id)).toEqual([a.id, b.id]);
  });

  it('filters by type', async () => {
    const t = new Date('2026-03-21T10:00:00Z');
    await createWorkItem(tmpDir, { type: 'task', status: 'open', priority: 'low', title: 'T', body: '', tags: [], links: [] }, t);
    await createWorkItem(tmpDir, { type: 'idea', status: 'open', priority: 'low', title: 'I', body: '', tags: [], links: [] }, t);

    const tasks = await listWorkItems(tmpDir, { type: 'task' });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].type).toBe('task');
  });

  it('filters by tags', async () => {
    const t = new Date('2026-03-21T10:00:00Z');
    await createWorkItem(tmpDir, { type: 'task', status: 'open', priority: 'low', title: 'Tagged', body: '', tags: ['backend'], links: [] }, t);
    await createWorkItem(tmpDir, { type: 'task', status: 'open', priority: 'low', title: 'Other', body: '', tags: ['frontend'], links: [] }, t);

    const result = await listWorkItems(tmpDir, { tags: ['backend'] });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Tagged');
  });
});

describe('searchWorkItems', () => {
  it('finds items matching query in title or body', async () => {
    const t = new Date('2026-03-21T10:00:00Z');
    await createWorkItem(tmpDir, { type: 'task', status: 'open', priority: 'low', title: 'Refactor auth module', body: '', tags: [], links: [] }, t);
    await createWorkItem(tmpDir, { type: 'task', status: 'open', priority: 'low', title: 'Fix bug', body: 'auth service crashes', tags: [], links: [] }, t);
    await createWorkItem(tmpDir, { type: 'task', status: 'open', priority: 'low', title: 'Unrelated', body: 'nothing here', tags: [], links: [] }, t);

    const results = await searchWorkItems(tmpDir, 'auth');
    expect(results).toHaveLength(2);
  });
});
