import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { generateId, idToFilename, filenameToId } from './id.js';
import type { WorkItem, WorkItemFilter, WorkItemPriority, WorkItemSource, WorkItemStatus, WorkItemType } from './types.js';

/**
 * Parses a work item markdown file into a WorkItem object.
 */
export function parseWorkItem(id: string, content: string): WorkItem {
  const { data, content: body } = matter(content);
  const frontmatter = data as Record<string, unknown>;

  return {
    id,
    type: readString(frontmatter.type) as WorkItemType,
    status: readString(frontmatter.status) as WorkItemStatus,
    priority: readString(frontmatter.priority) as WorkItemPriority,
    title: readString(frontmatter.title, ''),
    body: body.trim(),
    created: readString(frontmatter.created),
    updated: readString(frontmatter.updated),
    source: readSource(frontmatter.source),
    tags: readStringArray(frontmatter.tags),
    links: readStringArray(frontmatter.links),
  };
}

/**
 * Serializes a WorkItem into a markdown string with YAML frontmatter.
 */
export function serializeWorkItem(item: WorkItem): string {
  const frontmatter: Record<string, unknown> = {
    type: item.type,
    status: item.status,
    priority: item.priority,
    title: item.title,
    created: item.created,
    updated: item.updated,
  };
  if (item.source && Object.keys(item.source).length > 0) {
    frontmatter.source = item.source;
  }
  if (item.tags && item.tags.length > 0) {
    frontmatter.tags = item.tags;
  }
  if (item.links && item.links.length > 0) {
    frontmatter.links = item.links;
  }
  return matter.stringify(item.body ? `\n${item.body}\n` : '\n', frontmatter);
}

/**
 * Creates a new work item file on disk and returns the created WorkItem.
 */
export async function createWorkItem(
  repoPath: string,
  fields: Omit<WorkItem, 'id' | 'created' | 'updated'>,
  now: Date = new Date(),
): Promise<WorkItem> {
  const id = generateId(now);
  const iso = now.toISOString();
  const item: WorkItem = { ...fields, id, created: iso, updated: iso };
  const content = serializeWorkItem(item);
  const filePath = path.join(repoPath, idToFilename(id));
  await fs.writeFile(filePath, content, 'utf8');
  return item;
}

/**
 * Reads a work item by ID.
 */
export async function getWorkItem(repoPath: string, id: string): Promise<WorkItem> {
  const filePath = path.join(repoPath, idToFilename(id));
  const content = await fs.readFile(filePath, 'utf8');
  return parseWorkItem(id, content);
}

/**
 * Updates frontmatter fields and/or body of an existing work item.
 */
export async function updateWorkItem(
  repoPath: string,
  id: string,
  patch: Partial<Omit<WorkItem, 'id' | 'created'>>,
  now: Date = new Date(),
): Promise<WorkItem> {
  const existing = await getWorkItem(repoPath, id);
  const updated: WorkItem = {
    ...existing,
    ...patch,
    id,
    created: existing.created,
    updated: now.toISOString(),
  };
  const content = serializeWorkItem(updated);
  const filePath = path.join(repoPath, idToFilename(id));
  await fs.writeFile(filePath, content, 'utf8');
  return updated;
}

/**
 * Lists all work items in the repo, optionally filtered.
 */
export async function listWorkItems(
  repoPath: string,
  filter?: WorkItemFilter,
): Promise<WorkItem[]> {
  const entries = await fs.readdir(repoPath);
  const items: WorkItem[] = [];

  for (const entry of entries) {
    const id = filenameToId(entry);
    if (!id) continue;
    try {
      const item = await getWorkItem(repoPath, id);
      if (matchesFilter(item, filter)) {
        items.push(item);
      }
    } catch {
      // skip unreadable files
    }
  }

  return items.sort((a, b) => a.created.localeCompare(b.created));
}

/**
 * Full-text search in work item bodies and titles.
 */
export async function searchWorkItems(
  repoPath: string,
  query: string,
): Promise<WorkItem[]> {
  const all = await listWorkItems(repoPath);
  const lower = query.toLowerCase();
  return all.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.body.toLowerCase().includes(lower),
  );
}

function matchesFilter(item: WorkItem, filter?: WorkItemFilter): boolean {
  if (!filter) return true;
  if (filter.type && item.type !== filter.type) return false;
  if (filter.status && item.status !== filter.status) return false;
  if (filter.priority && item.priority !== filter.priority) return false;
  if (filter.agent && item.source?.agent !== filter.agent) return false;
  if (filter.machine && item.source?.machine !== filter.machine) return false;
  if (filter.tags && filter.tags.length > 0) {
    const itemTags = item.tags ?? [];
    if (!filter.tags.every((t) => itemTags.includes(t))) return false;
  }
  return true;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function readSource(value: unknown): WorkItemSource | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const source = value as Record<string, unknown>;
  const result: WorkItemSource = {};

  if (typeof source.agent === 'string') {
    result.agent = source.agent;
  }
  if (typeof source.context === 'string') {
    result.context = source.context;
  }
  if (typeof source.machine === 'string') {
    result.machine = source.machine;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
