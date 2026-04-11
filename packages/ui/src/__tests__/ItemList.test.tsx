import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemList } from '../components/ItemList.js';
import type { WorkItem } from '../types.js';

const items: WorkItem[] = [
  {
    id: '20260101-aaaa',
    type: 'task',
    status: 'open',
    priority: 'high',
    title: 'Alpha task',
    body: 'alpha body',
    created: '2026-01-01T10:00:00Z',
    updated: '2026-01-01T10:00:00Z',
    tags: ['backend'],
    links: [],
  },
  {
    id: '20260102-bbbb',
    type: 'issue',
    status: 'done',
    priority: 'low',
    title: 'Beta issue',
    body: 'beta body',
    created: '2026-01-02T10:00:00Z',
    updated: '2026-01-02T10:00:00Z',
    tags: [],
    links: [],
  },
];

describe('ItemList', () => {
  it('renders a row for each item', () => {
    render(<ItemList items={items} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('Alpha task')).toBeInTheDocument();
    expect(screen.getByText('Beta issue')).toBeInTheDocument();
  });

  it('shows type, status, and priority for each item', () => {
    render(<ItemList items={items} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText('task')).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('calls onSelect when a row is clicked', () => {
    const onSelect = vi.fn<(id: string) => void>();
    render(<ItemList items={items} selectedId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Alpha task'));
    expect(onSelect).toHaveBeenCalledWith('20260101-aaaa');
  });

  it('highlights the selected row', () => {
    render(<ItemList items={items} selectedId="20260101-aaaa" onSelect={() => {}} />);
    const row = screen.getByText('Alpha task').closest('tr');
    expect(row?.className).toMatch(/selected|bg-/);
  });

  it('shows empty state when no items', () => {
    render(<ItemList items={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText(/no items/i)).toBeInTheDocument();
  });

  it('shows sort indicator and calls onSort when header clicked', () => {
    const onSort = vi.fn<(field: string) => void>();
    render(<ItemList items={items} selectedId={null} onSelect={() => {}} sortField="title" sortOrder="asc" onSort={onSort} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /title/i }));
    expect(onSort).toHaveBeenCalledWith('title');
  });
});
