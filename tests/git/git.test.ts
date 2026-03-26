import type { SimpleGit } from 'simple-git';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { commitAll, pullRemote, pushRemote } from '../../src/git/git.js';

function createMockGit(overrides: Record<string, unknown> = {}): SimpleGit {
  const git = {
    add: vi.fn(async () => {}),
    commit: vi.fn(async () => {}),
    getRemotes: vi.fn(async () => []),
    pull: vi.fn(async () => {}),
    push: vi.fn(async () => {}),
    status: vi.fn(async () => ({ staged: [] })),
    ...overrides,
  };

  return git as unknown as SimpleGit;
}

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('commitAll', () => {
  it('stages and commits when there are staged changes', async () => {
    const git = createMockGit({
      status: vi.fn(async () => ({ staged: ['WI-20260326-abcd.md'] })),
    });

    const committed = await commitAll(git, 'wi: create 20260326-abcd');

    expect(committed).toBe(true);
    expect(git.add).toHaveBeenCalledWith('.');
    expect(git.commit).toHaveBeenCalledWith('wi: create 20260326-abcd');
  });

  it('skips commit when there is nothing staged', async () => {
    const git = createMockGit();

    const committed = await commitAll(git, 'wi: noop');

    expect(committed).toBe(false);
    expect(git.add).toHaveBeenCalledWith('.');
    expect(git.commit).not.toHaveBeenCalled();
  });
});

describe('pullRemote', () => {
  it('warns once and skips pull when no remote is configured', async () => {
    const git = createMockGit();

    await pullRemote(git);
    await pullRemote(git);

    expect(git.pull).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[git] no remote configured; continuing with local-only work-items repository',
    );
  });

  it('pulls with rebase when a remote exists', async () => {
    const git = createMockGit({
      getRemotes: vi.fn(async () => [{ name: 'origin' }]),
    });

    await pullRemote(git);

    expect(git.pull).toHaveBeenCalledWith(['--rebase']);
  });

  it('logs pull failures as non-fatal', async () => {
    const git = createMockGit({
      getRemotes: vi.fn(async () => [{ name: 'origin' }]),
      pull: vi.fn(async () => {
        throw new Error('network down');
      }),
    });

    await pullRemote(git);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[git] pull failed (non-fatal):', 'network down');
  });
});

describe('pushRemote', () => {
  it('warns once across sync operations when no remote is configured', async () => {
    const git = createMockGit();

    await pullRemote(git);
    await pushRemote(git);

    expect(git.push).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[git] no remote configured; continuing with local-only work-items repository',
    );
  });

  it('pushes when a remote exists', async () => {
    const git = createMockGit({
      getRemotes: vi.fn(async () => [{ name: 'origin' }]),
    });

    await pushRemote(git);

    expect(git.push).toHaveBeenCalled();
  });

  it('logs push failures as non-fatal', async () => {
    const git = createMockGit({
      getRemotes: vi.fn(async () => [{ name: 'origin' }]),
      push: vi.fn(async () => {
        throw new Error('push rejected');
      }),
    });

    await pushRemote(git);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[git] push failed (non-fatal):', 'push rejected');
  });
});
