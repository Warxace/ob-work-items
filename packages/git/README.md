# @warxace/ob-wi-git

Git sync layer for the **ob-work-items** work item tracker.

Thin wrapper around `simple-git` that handles commit, pull, and push, plus a mutation-triggered sync strategy.

## Responsibilities

- **`git.ts`** — `createGit`, `commitAll`, `pullRemote`, `pushRemote`. All remote operations are gracefully non-fatal (missing remote is warned once, network failures are logged).
- **`sync.ts`** — `afterMutation` (commit + optional push on write), `startPeriodicSync` (interval-based push), `onStartup` (pull on server start).

## SyncConfig

```ts
interface SyncConfig {
  push: {
    strategy: 'periodic' | 'on-commit' | 'manual';
    intervalSeconds: number;
  };
}
```

## API

```ts
import {
  createGit, commitAll, pullRemote, pushRemote,
  afterMutation, startPeriodicSync, onStartup,
} from '@warxace/ob-wi-git';
```
