import type { WorkItem, ListResponse, MetaStats, ListParams } from './types.js';

const BASE = '/api';

function buildQuery(params: ListParams): string {
  const q = new URLSearchParams();
  if (params.type) q.set('type', params.type);
  if (params.status) q.set('status', params.status);
  if (params.priority) q.set('priority', params.priority);
  // tags[] serialised as comma-separated for OR-matching on the server
  if (params.tags && params.tags.length > 0) q.set('tags', params.tags.join(','));
  if (params.q) q.set('q', params.q);
  if (params.sort) q.set('sort', params.sort);
  if (params.order) q.set('order', params.order);
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Fetch list of work items with optional filters. */
export async function fetchItems(params: ListParams = {}): Promise<ListResponse> {
  const res = await fetch(`${BASE}/items${buildQuery(params)}`);
  if (!res.ok) throw new Error(`Failed to fetch items: ${res.status}`);
  return res.json() as Promise<ListResponse>;
}

/** Fetch a single work item by ID. */
export async function fetchItem(id: string): Promise<WorkItem> {
  const res = await fetch(`${BASE}/items/${id}`);
  if (!res.ok) throw new Error(`Item not found: ${id}`);
  return res.json() as Promise<WorkItem>;
}

/** Update status and/or tags of a work item. */
export async function patchItem(
  id: string,
  patch: { status?: WorkItem['status']; tags?: string[] },
): Promise<WorkItem> {
  const res = await fetch(`${BASE}/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Failed to update item: ${res.status}`);
  return res.json() as Promise<WorkItem>;
}

/** Fetch all unique tags. */
export async function fetchTags(): Promise<string[]> {
  const res = await fetch(`${BASE}/meta/tags`);
  if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
  return res.json() as Promise<string[]>;
}

/** Fetch item counts grouped by type, status, priority. */
export async function fetchStats(): Promise<MetaStats> {
  const res = await fetch(`${BASE}/meta/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
  return res.json() as Promise<MetaStats>;
}
