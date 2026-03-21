import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { loadSchema, validateWorkItem, checkTransition, defaultSchemaYaml } from '../../src/core/schema.js';
import type { WorkItem } from '../../src/core/types.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-schema-test-'));
  await fs.mkdir(path.join(tmpDir, '.schema'));
  await fs.writeFile(path.join(tmpDir, '.schema', 'types.yaml'), defaultSchemaYaml(), 'utf8');
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

const makeItem = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  id: '20260321-a3f8',
  type: 'task',
  status: 'open',
  priority: 'medium',
  title: 'Test',
  body: '',
  created: '2026-03-21T10:00:00Z',
  updated: '2026-03-21T10:00:00Z',
  tags: [],
  links: [],
  ...overrides,
});

describe('loadSchema', () => {
  it('loads the default schema', async () => {
    const schema = await loadSchema(tmpDir);
    expect(schema).not.toBeNull();
    expect(schema).toHaveProperty('task');
    expect(schema).toHaveProperty('issue');
  });

  it('returns null if schema file is missing', async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wi-empty-'));
    const schema = await loadSchema(emptyDir);
    expect(schema).toBeNull();
    await fs.rm(emptyDir, { recursive: true });
  });
});

describe('validateWorkItem', () => {
  it('returns no expected_fields warnings for a complete task', async () => {
    const warnings = await validateWorkItem(tmpDir, makeItem());
    // recommended_fields (acceptance_criteria, estimate) may produce warnings — that's fine
    const errors = warnings.filter((w) => w.message.includes('is expected'));
    expect(errors).toHaveLength(0);
  });

  it('warns about unknown type', async () => {
    const warnings = await validateWorkItem(tmpDir, makeItem({ type: 'unknown' as never }));
    expect(warnings.some((w) => w.field === 'type')).toBe(true);
  });
});

describe('checkTransition', () => {
  it('allows typical transition without warning', async () => {
    const schema = await loadSchema(tmpDir);
    const warnings = checkTransition(schema, 'task', 'open', 'in-progress');
    expect(warnings).toHaveLength(0);
  });

  it('warns on atypical transition', async () => {
    const schema = await loadSchema(tmpDir);
    const warnings = checkTransition(schema, 'task', 'open', 'done');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].field).toBe('status');
  });

  it('returns no warnings when schema is null', () => {
    const warnings = checkTransition(null, 'task', 'open', 'done');
    expect(warnings).toHaveLength(0);
  });
});
