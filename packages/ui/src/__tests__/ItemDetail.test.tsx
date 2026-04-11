import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemDetail } from '../components/ItemDetail.js';
import type { WorkItem } from '../types.js';

const item: WorkItem = {
  id: '20260101-aaaa',
  type: 'task',
  status: 'open',
  priority: 'high',
  title: 'Alpha task',
  body: '## Details\n\nSome **bold** text.',
  created: '2026-01-01T10:00:00Z',
  updated: '2026-01-01T10:00:00Z',
  tags: ['backend', 'ci'],
  links: ['https://example.com', '20260102-bbbb'],
  source: { agent: 'opencode', machine: 'wsl' },
};

describe('ItemDetail', () => {
  it('renders the item title', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
    expect(screen.getByText('Alpha task')).toBeInTheDocument();
  });

  it('renders item ID', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
    expect(screen.getByText('20260101-aaaa')).toBeInTheDocument();
  });

  it('renders tags', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(screen.getByText('ci')).toBeInTheDocument();
  });

  it('renders links', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('renders markdown body', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
    // react-markdown renders the heading
    expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument();
  });

  it('has copy ID button', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
    expect(screen.getByRole('button', { name: /copy id/i })).toBeInTheDocument();
  });

  it('has copy title button', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
    expect(screen.getByRole('button', { name: /copy title/i })).toBeInTheDocument();
  });

  it('has copy markdown button', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
    expect(screen.getByRole('button', { name: /copy markdown/i })).toBeInTheDocument();
  });

  it('calls onUpdate with new status when status is changed', async () => {
    const onUpdate = vi.fn<(patch: { status?: WorkItem['status']; tags?: string[] }) => void>();
    render(<ItemDetail item={item} onUpdate={onUpdate} />);
    const select = screen.getByRole('combobox', { name: /status/i });
    fireEvent.change(select, { target: { value: 'done' } });
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'done' })));
  });

  it('renders source agent and machine', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
    expect(screen.getByText(/opencode/)).toBeInTheDocument();
    expect(screen.getByText(/wsl/)).toBeInTheDocument();
  });
});
