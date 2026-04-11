import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import type { SimpleGit } from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Config } from '../src/config.js';
import { defaultSchemaYaml } from '@warxace/ob-wi-core';

const { afterMutationMock } = vi.hoisted(() => ({
  afterMutationMock: vi.fn<(...args: unknown[]) => Promise<void>>(),
}));

vi.mock('@warxace/ob-wi-git', () => ({
  afterMutation: afterMutationMock,
}));

import { handleCreateWorkItem } from '../src/tools/create.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-tool-create-'));
  await fs.mkdir(path.join(tmpDir, '.schema'), { recursive: true });
  await fs.writeFile(path.join(tmpDir, '.schema', 'types.yaml'), defaultSchemaYaml(), 'utf8');
  afterMutationMock.mockReset();
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('handleCreateWorkItem', () => {
  it('creates a work item, returns warnings, and triggers mutation sync', async () => {
    const git = {} as SimpleGit;
    const config: Config = {
      workItemsPath: tmpDir,
      push: { strategy: 'manual', intervalSeconds: 30 },
    };

    const result = await handleCreateWorkItem(
      {
        type: 'task',
        status: 'open',
        priority: 'medium',
        title: 'Ship tool tests',
        body: 'Cover create handler behavior',
        tags: ['tests'],
        links: [],
      },
      tmpDir,
      git,
      config,
    );

    expect(result.item.id).toMatch(/^\d{8}-[0-9a-f]{4}$/);
    expect(result.item.title).toBe('Ship tool tests');
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'acceptance_criteria' }),
        expect.objectContaining({ field: 'estimate' }),
      ]),
    );
    expect(afterMutationMock).toHaveBeenCalledWith(
      git,
      config,
      `wi: create ${result.item.id} — ${result.item.title}`,
    );
  });
});
