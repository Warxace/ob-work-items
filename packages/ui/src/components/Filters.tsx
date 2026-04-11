import type { ListParams, WorkItemType, WorkItemStatus, WorkItemPriority } from '../types.js';

interface FiltersProps {
  params: ListParams;
  tags: string[];
  onChange: (params: ListParams) => void;
}

const TYPES: WorkItemType[] = ['task', 'issue', 'idea', 'decision', 'question'];
const STATUSES: WorkItemStatus[] = ['open', 'in-progress', 'blocked', 'done', 'cancelled'];
const PRIORITIES: WorkItemPriority[] = ['critical', 'high', 'medium', 'low'];

/** Count how many non-empty filters are active (excluding sort/order). */
function countActiveFilters(params: ListParams): number {
  let n = 0;
  if (params.type) n++;
  if (params.status) n++;
  if (params.priority) n++;
  if (params.tags) n++;
  if (params.q) n++;
  return n;
}

/**
 * Filter bar with search input and dropdowns for type, status, priority.
 * Calls onChange with full updated params object on every change.
 */
export function Filters({ params, tags, onChange }: FiltersProps) {
  const activeCount = countActiveFilters(params);

  function update(patch: Partial<ListParams>) {
    onChange({ ...params, ...patch });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Search */}
      <input
        type="text"
        placeholder="Search titles and bodies…"
        value={params.q ?? ''}
        onChange={(e) => update({ q: e.target.value || undefined })}
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

      {/* Tags */}
      {tags.length > 0 && (
        <label className="flex items-center gap-1 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Tag</span>
          <select
            aria-label="Tag"
            value={params.tags ?? ''}
            onChange={(e) => update({ tags: e.target.value || undefined })}
            className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All</option>
            {tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      )}

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
