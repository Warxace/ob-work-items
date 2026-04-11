import type { SimpleGit } from 'simple-git';
import { commitAll, pullRemote, pushRemote } from './git.js';

/** Subset of Config required by sync functions. */
export interface SyncConfig {
  push: {
    strategy: 'periodic' | 'on-commit' | 'manual';
    intervalSeconds: number;
  };
}

/**
 * Called after every mutation (create/update).
 * Commits immediately; pushes based on strategy.
 */
export async function afterMutation(
  git: SimpleGit,
  config: SyncConfig,
  commitMessage: string,
): Promise<void> {
  await commitAll(git, commitMessage);

  if (config.push.strategy === 'on-commit') {
    await pushRemote(git);
  }
}

/**
 * Starts the periodic push loop.
 * Returns a cleanup function to stop the interval.
 */
export function startPeriodicSync(
  git: SimpleGit,
  config: SyncConfig,
): () => void {
  if (config.push.strategy !== 'periodic') {
    return () => {};
  }

  const intervalMs = config.push.intervalSeconds * 1000;
  const handle = setInterval(() => {
    void pushRemote(git).catch((err: unknown) => {
      console.error('[sync] periodic push error:', err instanceof Error ? err.message : String(err));
    });
  }, intervalMs);

  return () => clearInterval(handle);
}

/**
 * Called on server startup: pull to get latest state.
 */
export async function onStartup(git: SimpleGit): Promise<void> {
  await pullRemote(git);
}
