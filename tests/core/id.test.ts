import { describe, it, expect } from 'vitest';
import { generateId, idToFilename, filenameToId } from '../../src/core/id.js';

describe('generateId', () => {
  it('generates ID in YYYYMMDD-xxxx format', () => {
    const id = generateId(new Date('2026-03-21T10:00:00Z'));
    expect(id).toMatch(/^20260321-[0-9a-f]{4}$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    // Not guaranteed but highly likely with random hex
    expect(ids.size).toBeGreaterThan(90);
  });
});

describe('idToFilename', () => {
  it('converts ID to filename', () => {
    expect(idToFilename('20260321-a3f8')).toBe('WI-20260321-a3f8.md');
  });
});

describe('filenameToId', () => {
  it('extracts ID from valid filename', () => {
    expect(filenameToId('WI-20260321-a3f8.md')).toBe('20260321-a3f8');
  });

  it('returns null for non-WI files', () => {
    expect(filenameToId('README.md')).toBeNull();
    expect(filenameToId('.schema')).toBeNull();
    expect(filenameToId('WI-bad.md')).toBeNull();
  });
});
