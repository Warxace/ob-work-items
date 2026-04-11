import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWorkItem } from '@warxace/ob-wi-core';
import { handleSearchWorkItems } from '../src/tools/search.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-tool-search-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('handleSearchWorkItems', () => {
  it('returns matches from title and body', async () => {
    const now = new Date('2026-03-26T10:00:00Z');

    await createWorkItem(tmpDir, {
      type: 'task',
      status: 'open',
      priority: 'medium',
      title: 'Refine auth rollout',
      body: '',
      tags: [],
      links: [],
    }, now);
    await createWorkItem(tmpDir, {
      type: 'task',
      status: 'open',
      priority: 'medium',
      title: 'Investigate regressions',
      body: 'Auth token refresh fails after deploy',
      tags: [],
      links: [],
    }, new Date('2026-03-26T11:00:00Z'));

    const result = await handleSearchWorkItems({ query: 'auth' }, tmpDir);

    expect(result).toHaveLength(2);
  });
});
