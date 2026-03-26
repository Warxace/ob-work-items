import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defaultSchemaYaml } from '../../src/core/schema.js';
import { createWorkItem } from '../../src/core/work-item.js';
import { handleValidateWorkItem } from '../../src/tools/validate.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-tool-validate-'));
  await fs.mkdir(path.join(tmpDir, '.schema'), { recursive: true });
  await fs.writeFile(path.join(tmpDir, '.schema', 'types.yaml'), defaultSchemaYaml(), 'utf8');
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('handleValidateWorkItem', () => {
  it('returns warnings and marks incomplete task invalid', async () => {
    const created = await createWorkItem(
      tmpDir,
      {
        type: 'task',
        status: 'open',
        priority: 'medium',
        title: 'Document validation behavior',
        body: '',
        tags: [],
        links: [],
      },
      new Date('2026-03-26T10:00:00Z'),
    );

    const result = await handleValidateWorkItem({ id: created.id }, tmpDir);

    expect(result.item.id).toBe(created.id);
    expect(result.valid).toBe(false);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'acceptance_criteria' }),
        expect.objectContaining({ field: 'estimate' }),
      ]),
    );
  });

  it('marks an item valid when schema is absent', async () => {
    const noSchemaDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-tool-validate-empty-'));

    try {
      const created = await createWorkItem(
        noSchemaDir,
        {
          type: 'task',
          status: 'open',
          priority: 'medium',
          title: 'No schema repo',
          body: '',
          tags: [],
          links: [],
        },
        new Date('2026-03-26T11:00:00Z'),
      );

      const result = await handleValidateWorkItem({ id: created.id }, noSchemaDir);

      expect(result.valid).toBe(true);
      expect(result.warnings).toEqual([]);
    } finally {
      await fs.rm(noSchemaDir, { recursive: true, force: true });
    }
  });
});
