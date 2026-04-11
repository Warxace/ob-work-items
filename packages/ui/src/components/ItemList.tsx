import type { WorkItem } from '../types.js';

interface ItemListProps {
  items: WorkItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-600 dark:text-red-400 font-semibold',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-gray-400',
};

const STATUS_COLOR: Record<string, string> = {
  open: 'text-blue-600 dark:text-blue-400',
  'in-progress': 'text-indigo-600 dark:text-indigo-400',
  blocked: 'text-red-600 dark:text-red-400',
  done: 'text-green-600 dark:text-green-400',
  cancelled: 'text-gray-400 line-through',
};

const TYPE_ICON: Record<string, string> = {
  task: '✓',
  issue: '!',
  idea: '💡',
  decision: '⚖',
  question: '?',
};

interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'type', label: 'Type', sortable: true, className: 'w-20' },
  { key: 'priority', label: 'Pri', sortable: true, className: 'w-16' },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'status', label: 'Status', sortable: true, className: 'w-28' },
  { key: 'updated', label: 'Updated', sortable: true, className: 'w-28' },
];

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Master list view — sortable table of work items.
 * Clicking a row calls onSelect; clicking a sortable column header calls onSort.
 */
export function ItemList({ items, selectedId, onSelect, sortField, sortOrder, onSort }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-gray-400">
        No items match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-900 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 border-b border-gray-200 dark:border-gray-700 select-none ${col.className ?? ''} ${col.sortable ? 'cursor-pointer hover:text-gray-800 dark:hover:text-gray-200' : ''}`}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                {col.label}
                {sortField === col.key && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950 selected'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <td className="px-3 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <span className="mr-1">{TYPE_ICON[item.type] ?? item.type[0]}</span>
                  {item.type}
                </td>
                <td className={`px-3 py-2 whitespace-nowrap ${PRIORITY_COLOR[item.priority] ?? ''}`}>
                  {item.priority}
                </td>
                <td className="px-3 py-2 max-w-xs">
                  <span className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                    {item.title}
                  </span>
                  {item.tags && item.tags.length > 0 && (
                    <span className="ml-2 text-xs text-gray-400">
                      {item.tags.slice(0, 3).join(' · ')}
                      {item.tags.length > 3 ? ` +${item.tags.length - 3}` : ''}
                    </span>
                  )}
                </td>
                <td className={`px-3 py-2 whitespace-nowrap ${STATUS_COLOR[item.status] ?? ''}`}>
                  {item.status}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-400 tabular-nums">
                  {formatDate(item.updated)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
