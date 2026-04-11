import { useState, useRef, useEffect } from 'react';

interface TagPickerProps {
  /** All available tags for autocomplete. */
  allTags: string[];
  /** Currently selected tags. */
  selected: string[];
  /** Called when the selection changes. */
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/**
 * Multi-select tag picker with:
 * - Chips for selected tags (click × to remove)
 * - Text input with filtered dropdown (autocomplete)
 * - Keyboard: Enter/Tab to confirm, Backspace to remove last, Escape to close
 * - Tags combined with OR logic (any selected tag matches)
 */
export function TagPicker({ allTags, selected, onChange, placeholder = 'Filter by tags…' }: TagPickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const suggestions = allTags.filter(
    (t) => !selected.includes(t) && t.toLowerCase().includes(inputValue.toLowerCase()),
  );

  function addTag(tag: string) {
    if (!selected.includes(tag)) {
      onChange([...selected, tag]);
    }
    setInputValue('');
    setHighlightIdx(0);
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    onChange(selected.filter((t) => t !== tag));
  }

  function removeLastTag() {
    if (inputValue === '' && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (open && suggestions[highlightIdx]) {
        e.preventDefault();
        addTag(suggestions[highlightIdx]);
      } else if (inputValue.trim() && !open) {
        // allow typing arbitrary tag not in list
        e.preventDefault();
        addTag(inputValue.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Backspace') {
      removeLastTag();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setInputValue('');
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightIdx(0);
  }, [inputValue]);

  return (
    <div className="relative flex flex-col gap-1 min-w-48">
      {/* Input + chips row */}
      <div
        className="flex flex-wrap items-center gap-1 px-2 py-1 min-h-[34px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 cursor-text focus-within:ring-2 focus-within:ring-indigo-400"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="ml-0.5 hover:text-indigo-900 dark:hover:text-indigo-100 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder={selected.length === 0 ? placeholder : ''}
          onChange={(e) => { setInputValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="flex-1 min-w-16 text-sm bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
          aria-label="Tag filter input"
          aria-expanded={open && suggestions.length > 0}
          role="combobox"
          aria-autocomplete="list"
        />
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
        >
          {suggestions.map((tag, idx) => (
            <button
              key={tag}
              type="button"
              onPointerDown={(e) => { e.preventDefault(); addTag(tag); }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                idx === highlightIdx
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
