import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWorkItem } from '@warxace/ob-wi-core';
import { handleGetWorkItem } from '../src/tools/get.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-tool-get-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('handleGetWorkItem', () => {
  it('returns an existing work item by id', async () => {
    const created = await createWorkItem(
      tmpDir,
      {
        type: 'issue',
        status: 'open',
        priority: 'high',
        title: 'Broken deploy',
        body: 'Investigate CI rollback',
        tags: ['ops'],
        links: [],
      },
      new Date('2026-03-26T10:00:00Z'),
    );

    const result = await handleGetWorkItem({ id: created.id }, tmpDir);

    expect(result.id).toBe(created.id);
    expect(result.title).toBe('Broken deploy');
    expect(result.body).toBe('Investigate CI rollback');
  });
});
