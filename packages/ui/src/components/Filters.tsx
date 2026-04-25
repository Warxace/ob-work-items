import { useState, useRef, useEffect } from 'react';
import type { ListParams, WorkItemType, WorkItemStatus, WorkItemPriority } from '../types.js';
import { TagPicker } from './TagPicker.js';

interface FiltersProps {
  params: ListParams;
  tags: string[];
  onChange: (params: ListParams) => void;
}

const TYPES: WorkItemType[] = ['task', 'issue', 'idea', 'decision', 'question'];
const STATUSES: WorkItemStatus[] = ['open', 'in-progress', 'blocked', 'done', 'cancelled'];
const PRIORITIES: WorkItemPriority[] = ['critical', 'high', 'medium', 'low'];

/** Count how many non-empty filters are active (excluding sort/order). */
function countActiveFilters(params: ListParams, searchValue: string): number {
  let n = 0;
  if (params.type) n++;
  if (params.status) n++;
  if (params.priority) n++;
  if (params.tags && params.tags.length > 0) n += params.tags.length;
  if (searchValue) n++;
  return n;
}

/**
 * Filter bar: search input, type/status/priority dropdowns, and a
 * multi-select TagPicker with autocomplete and chip display.
 * All tag values are combined with OR logic.
 */
export function Filters({ params, tags, onChange }: FiltersProps) {
  const [searchValue, setSearchValue] = useState(params.q ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const activeCount = countActiveFilters(params, searchValue);

  // Sync external q changes (URL navigation, Clear button) into local state
  useEffect(() => {
    setSearchValue(params.q ?? '');
  }, [params.q]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function update(patch: Partial<ListParams>) {
    onChange({ ...params, ...patch });
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...paramsRef.current, q: value || undefined });
    }, 500);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Search */}
      <input
        type="text"
        placeholder="Search IDs, titles and bodies…"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="flex-1 min-w-40 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      {/* Type */}
      <label className="flex items-center gap-1 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Type</span>
        <select
          aria-label="Type"
          value={params.type ?? ''}
          onChange={(e) => update({ type: (e.target.value as WorkItemType) || undefined })}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>

      {/* Status */}
      <label className="flex items-center gap-1 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Status</span>
        <select
          aria-label="Status"
          value={params.status ?? ''}
          onChange={(e) => update({ status: (e.target.value as WorkItemStatus) || undefined })}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      {/* Priority */}
      <label className="flex items-center gap-1 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Priority</span>
        <select
          aria-label="Priority"
          value={params.priority ?? ''}
          onChange={(e) => update({ priority: (e.target.value as WorkItemPriority) || undefined })}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      {/* Tags — multi-select with autocomplete */}
      <TagPicker
        allTags={tags}
        selected={params.tags ?? []}
        onChange={(t) => update({ tags: t.length > 0 ? t : undefined })}
      />

      {/* Active filter badge + clear */}
      {activeCount > 0 && (
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
            {activeCount}
          </span>
          <button
            aria-label="Clear filters"
            onClick={() => onChange({})}
            className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
