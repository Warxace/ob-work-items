import { useState, useCallback } from 'react';
import Markdown from 'react-markdown';
import type { WorkItem } from '../types.js';

interface ItemDetailProps {
  item: WorkItem;
  onUpdate: (patch: { status?: WorkItem['status']; tags?: string[] }) => void;
  /** Called when user clicks "filter by tag" — adds that tag to the active filter set. */
  onFilterByTag?: (tag: string) => void;
  /** Tags currently active in the filter — used to indicate already-filtered tags. */
  activeTags?: string[];
  /** Called when user clicks "Open" on a work item ID link — navigates to that item. */
  onNavigate?: (id: string) => void;
}

const STATUSES: WorkItem['status'][] = ['open', 'in-progress', 'blocked', 'done', 'cancelled'];

/** Regex matching a work item ID: YYYYMMDD-xxxx */
const WI_ID_RE = /^\d{8}-[0-9a-f]{4}$/;

/** Copy text to clipboard, briefly shows "Copied!" feedback. */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback((label: string, text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  }, []);

  return { copied, copy };
}

function CopyBtn({ label, text, copied, copy }: {
  label: string;
  text: string;
  copied: string | null;
  copy: (label: string, text: string) => void;
}) {
  const isCopied = copied === label;
  return (
    <button
      aria-label={label}
      onClick={() => copy(label, text)}
      className="px-2 py-0.5 text-xs rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 transition-colors"
    >
      {isCopied ? 'Copied!' : label}
    </button>
  );
}

function Tag({ text, onFilter, isFiltered }: {
  text: string;
  onFilter?: (tag: string) => void;
  isFiltered?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 group">
      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
        {text}
      </span>
      {onFilter && (
        <button
          type="button"
          aria-label={isFiltered ? `Tag ${text} already in filter` : `Filter by tag ${text}`}
          onClick={() => onFilter(text)}
          disabled={isFiltered}
          title={isFiltered ? 'Already in filter' : 'Add to filter'}
          className={`text-xs px-1 py-0.5 rounded transition-colors ${
            isFiltered
              ? 'text-indigo-400 dark:text-indigo-600 cursor-default'
              : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100'
          }`}
        >
          {isFiltered ? '✓' : '+'}
        </button>
      )}
    </span>
  );
}

/**
 * A single entry in the links list.
 *
 * Three display modes:
 * - http(s) URL  → anchor that opens in a new tab
 * - work item ID → "Open" button (calls onNavigate) + "Copy" button
 * - anything else → "Copy" button only
 */
function LinkItem({
  href,
  onNavigate,
  copied,
  copy,
}: {
  href: string;
  onNavigate?: (id: string) => void;
  copied: string | null;
  copy: (label: string, text: string) => void;
}) {
  const isUrl = href.startsWith('http://') || href.startsWith('https://');
  const isWiId = WI_ID_RE.test(href);
  const copyLabel = `Copy link ${href}`;

  if (isUrl) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-500 hover:underline break-all text-sm"
        >
          {href} ↗
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
        {href}
      </span>
      {isWiId && onNavigate && (
        <button
          type="button"
          aria-label={`Open ${href}`}
          onClick={() => onNavigate(href)}
          className="text-xs px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors opacity-0 group-hover:opacity-100"
        >
          Open ↗
        </button>
      )}
      <button
        type="button"
        aria-label={copyLabel}
        onClick={() => copy(copyLabel, href)}
        className="text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied === copyLabel ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

/**
 * Detail panel for a single work item.
 * Shows all fields, rendered markdown body, and controls for status/tags editing.
 */
export function ItemDetail({ item, onUpdate, onFilterByTag, activeTags = [], onNavigate }: ItemDetailProps) {
  const { copied, copy } = useCopy();

  const markdownText = `# ${item.title}\n\nID: ${item.id}\n\n${item.body}`;

  return (
    <div className="flex flex-col gap-4 p-4 text-sm overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-snug">
          {item.title}
        </h2>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
          <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
            {item.id}
          </code>
          <span>·</span>
          <span>{item.type}</span>
          <span>·</span>
          <span>created {item.created.slice(0, 10)}</span>
          {item.source?.agent && <><span>·</span><span>{item.source.agent}</span></>}
          {item.source?.machine && <><span>·</span><span>{item.source.machine}</span></>}
        </div>
      </div>

      {/* Copy buttons */}
      <div className="flex flex-wrap gap-1.5">
        <CopyBtn label="Copy ID" text={item.id} copied={copied} copy={copy} />
        <CopyBtn label="Copy title" text={item.title} copied={copied} copy={copy} />
        <CopyBtn label="Copy markdown" text={markdownText} copied={copied} copy={copy} />
      </div>

      {/* Status editor */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-select" className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
          Status
        </label>
        <select
          id="status-select"
          aria-label="Status"
          value={item.status}
          onChange={(e) => onUpdate({ status: e.target.value as WorkItem['status'] })}
          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
          {item.priority}
        </span>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          {onFilterByTag && (
            <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">Tags</span>
          )}
          {item.tags.map((t) => (
            <Tag
              key={t}
              text={t}
              onFilter={onFilterByTag}
              isFiltered={activeTags.includes(t)}
            />
          ))}
        </div>
      )}

      {/* Links */}
      {item.links && item.links.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Links</span>
          {item.links.map((l) => (
            <LinkItem
              key={l}
              href={l}
              onNavigate={onNavigate}
              copied={copied}
              copy={copy}
            />
          ))}
        </div>
      )}

      {/* Markdown body */}
      {item.body && (
        <div className="prose dark:prose-invert max-w-none border-t border-gray-100 dark:border-gray-800 pt-3">
          <Markdown>{item.body}</Markdown>
        </div>
      )}
    </div>
  );
}
