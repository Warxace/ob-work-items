import { simpleGit, SimpleGit } from 'simple-git';

export function createGit(repoPath: string): SimpleGit {
  return simpleGit(repoPath);
}

/**
 * Stages all changes and commits with the given message.
 * Returns false (with a warning) if there's nothing to commit.
 */
export async function commitAll(git: SimpleGit, message: string): Promise<boolean> {
  await git.add('.');
  const status = await git.status();
  if (status.staged.length === 0) {
    return false;
  }
  await git.commit(message);
  return true;
}

/**
 * Pulls from remote (rebase). Gracefully handles missing remote.
 */
export async function pullRemote(git: SimpleGit): Promise<void> {
  try {
    const remotes = await git.getRemotes();
    if (remotes.length === 0) return;
    await git.pull(['--rebase']);
  } catch (err) {
    console.error('[git] pull failed (non-fatal):', (err as Error).message);
  }
}

/**
 * Pushes to remote. Gracefully handles missing remote or network issues.
 */
export async function pushRemote(git: SimpleGit): Promise<void> {
  try {
    const remotes = await git.getRemotes();
    if (remotes.length === 0) return;
    await git.push();
  } catch (err) {
    console.error('[git] push failed (non-fatal):', (err as Error).message);
  }
}
