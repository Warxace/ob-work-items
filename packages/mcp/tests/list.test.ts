import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWorkItem } from '@warxace/ob-wi-core';
import { handleListWorkItems } from '../src/tools/list.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-tool-list-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('handleListWorkItems', () => {
  it('passes filters through to the core list implementation', async () => {
    const now = new Date('2026-03-26T10:00:00Z');

    await createWorkItem(
      tmpDir,
      {
        type: 'task',
        status: 'open',
        priority: 'medium',
        title: 'Coder task',
        body: '',
        source: { agent: 'coder' },
        tags: ['backend'],
        links: [],
      },
      now,
    );
    await createWorkItem(
      tmpDir,
      {
        type: 'task',
        status: 'open',
        priority: 'medium',
        title: 'Planner task',
        body: '',
        source: { agent: 'planner' },
        tags: ['backend'],
        links: [],
      },
      new Date('2026-03-26T11:00:00Z'),
    );

    const result = await handleListWorkItems({ agent: 'coder', tags: ['backend'] }, tmpDir);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Coder task');
  });
});
