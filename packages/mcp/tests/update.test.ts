import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import type { SimpleGit } from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Config } from '../src/config.js';
import { defaultSchemaYaml } from '@warxace/ob-wi-core';
import { createWorkItem } from '@warxace/ob-wi-core';

const { afterMutationMock } = vi.hoisted(() => ({
  afterMutationMock: vi.fn<(...args: unknown[]) => Promise<void>>(),
}));

vi.mock('@warxace/ob-wi-git', () => ({
  afterMutation: afterMutationMock,
}));

import { handleUpdateWorkItem } from '../src/tools/update.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-tool-update-'));
  await fs.mkdir(path.join(tmpDir, '.schema'), { recursive: true });
  await fs.writeFile(path.join(tmpDir, '.schema', 'types.yaml'), defaultSchemaYaml(), 'utf8');
  afterMutationMock.mockReset();
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('handleUpdateWorkItem', () => {
  it('updates a work item, returns advisory warnings, and triggers mutation sync', async () => {
    const existing = await createWorkItem(
      tmpDir,
      {
        type: 'task',
        status: 'open',
        priority: 'medium',
        title: 'Ship tool tests',
        body: '',
        tags: [],
        links: [],
      },
      new Date('2026-03-26T10:00:00Z'),
    );

    const git = {} as SimpleGit;
    const config: Config = {
      workItemsPath: tmpDir,
      push: { strategy: 'manual', intervalSeconds: 30 },
    };

    const result = await handleUpdateWorkItem(
      {
        id: existing.id,
        status: 'done',
        body: 'Finished and ready for review',
      },
      tmpDir,
      git,
      config,
    );

    expect(result.item.status).toBe('done');
    expect(result.item.body).toBe('Finished and ready for review');
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'status' }),
        expect.objectContaining({ field: 'acceptance_criteria' }),
        expect.objectContaining({ field: 'estimate' }),
      ]),
    );
    expect(afterMutationMock).toHaveBeenCalledWith(
      git,
      config,
      `wi: update ${result.item.id} — ${result.item.title}`,
    );
  });
});
