import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filters } from './components/Filters.js';
import { ItemList } from './components/ItemList.js';
import { ItemDetail } from './components/ItemDetail.js';
import { useWorkItems, useTags } from './hooks/useWorkItems.js';
import { patchItem, fetchItem } from './api.js';
import type { WorkItem, ListParams } from './types.js';

/** Sync ListParams to/from URL search params. */
function useFilterParams(): [ListParams, (p: ListParams) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const params: ListParams = {};
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const tags = searchParams.get('tags');
  const q = searchParams.get('q');
  const sort = searchParams.get('sort');
  const order = searchParams.get('order');

  if (type) params.type = type as ListParams['type'];
  if (status) params.status = status as ListParams['status'];
  if (priority) params.priority = priority as ListParams['priority'];
  // tags stored as comma-separated in URL: ?tags=a,b,c
  if (tags) params.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
  if (q) params.q = q;
  if (sort) params.sort = sort;
  if (order) params.order = order as 'asc' | 'desc';

  const setParams = useCallback((p: ListParams) => {
    const next = new URLSearchParams();
    if (p.type) next.set('type', p.type);
    if (p.status) next.set('status', p.status);
    if (p.priority) next.set('priority', p.priority);
    if (p.tags && p.tags.length > 0) next.set('tags', p.tags.join(','));
    if (p.q) next.set('q', p.q);
    if (p.sort) next.set('sort', p.sort);
    if (p.order) next.set('order', p.order);
    setSearchParams(next);
  }, [setSearchParams]);

  return [params, setParams];
}

export default function App() {
  const [filterParams, setFilterParams] = useFilterParams();
  const [sortField, setSortField] = useState(filterParams.sort ?? 'updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filterParams.order ?? 'desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WorkItem | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Merge sort into filter params
  const params: ListParams = { ...filterParams, sort: sortField, order: sortOrder };
  const { items, total, loading, error, refresh } = useWorkItems(params);
  const { tags } = useTags();

  // Load detail when selected changes
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    fetchItem(selectedId).then(setDetail).catch(() => setDetail(null));
  }, [selectedId]);

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!items.length) return;
      const idx = selectedId ? items.findIndex((i) => i.id === selectedId) : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = idx < items.length - 1 ? items[idx + 1] : items[0];
        setSelectedId(next.id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = idx > 0 ? items[idx - 1] : items[items.length - 1];
        setSelectedId(prev.id);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [items, selectedId]);

  function handleSort(field: string) {
    if (sortField === field) {
      setSortOrder((o) => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  async function handleUpdate(patch: { status?: WorkItem['status']; tags?: string[] }) {
    if (!selectedId) return;
    try {
      const updated = await patchItem(selectedId, patch);
      setDetail(updated);
      refresh();
    } catch {
      // TODO: show error toast
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-base">ob-work-items</span>
          <span className="text-xs text-gray-400">
            {loading ? 'loading…' : `${total} item${total !== 1 ? 's' : ''}`}
          </span>
        </div>
        <button
          onClick={refresh}
          className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          aria-label="Refresh"
        >
          ↺ Refresh
        </button>
      </header>

      {/* Filters */}
      <Filters
        params={filterParams}
        tags={tags}
        onChange={(p) => setFilterParams(p)}
      />

      {/* Main: Master / Detail */}
      <div className="flex flex-1 min-h-0">
        {/* Master list */}
        <div
          ref={listRef}
          className={`flex flex-col overflow-y-auto border-r border-gray-200 dark:border-gray-800 ${detail ? 'w-1/2' : 'w-full'}`}
        >
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border-b border-red-200">
              Error: {error}
            </div>
          )}
          {loading && !items.length ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">Loading…</div>
          ) : (
            <ItemList
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </div>

        {/* Detail panel */}
        {detail && (
          <div className="flex-1 overflow-y-auto">
            <ItemDetail
              item={detail}
              onUpdate={(patch) => void handleUpdate(patch)}
              activeTags={filterParams.tags ?? []}
              onFilterByTag={(tag) => {
                const current = filterParams.tags ?? [];
                if (!current.includes(tag)) {
                  setFilterParams({ ...filterParams, tags: [...current, tag] });
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
