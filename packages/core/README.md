# @warxace/ob-wi-core

Core library for the **ob-work-items** git-native work item tracker.

Provides types, parsing, CRUD, and search — with no dependency on MCP or any transport layer.

## Responsibilities

- **Types** (`types.ts`) — `WorkItem`, `WorkItemFilter`, `WorkItemSource`, `ValidationWarning`, and union types.
- **ID utilities** (`id.ts`) — generate IDs (`YYYYMMDD-xxxx`), map to/from filenames.
- **Parsing** (`work-item.ts`) — `parseWorkItem` / `serializeWorkItem` (YAML frontmatter + markdown body via `gray-matter`).
- **CRUD** (`work-item.ts`) — `createWorkItem`, `getWorkItem`, `updateWorkItem` operating on a repo path.
- **Query** (`work-item.ts`) — `listWorkItems` (filtered), `searchWorkItems` (full-text).
- **Schema** (`schema.ts`) — advisory validation from `.schema/types.yaml`; never blocks operations.

## File format

Each work item is stored as `WI-YYYYMMDD-xxxx.md` in the repository root:

```
---
type: task
status: open
priority: medium
title: My task
created: 2026-03-21T10:00:00.000Z
updated: 2026-03-21T10:00:00.000Z
tags: [backend]
---

Body text here.
```

## API

```ts
import {
  createWorkItem, getWorkItem, updateWorkItem,
  listWorkItems, searchWorkItems,
  parseWorkItem, serializeWorkItem,
  loadSchema, validateWorkItem, checkTransition,
  generateId, idToFilename, filenameToId,
} from '@warxace/ob-wi-core';
```

All CRUD functions take a `repoPath: string` as their first argument and operate directly on the filesystem.
