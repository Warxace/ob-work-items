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
    // URL is rendered as an anchor; match by role to avoid depending on exact text decoration
    expect(screen.getByRole('link', { name: /example\.com/i })).toBeInTheDocument();
  });

  it('renders markdown body', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
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

  it('shows filter buttons for tags when onFilterByTag is provided', () => {
    const onFilterByTag = vi.fn<(tag: string) => void>();
    render(<ItemDetail item={item} onUpdate={() => {}} onFilterByTag={onFilterByTag} />);
    // + buttons for non-active tags
    expect(screen.getByRole('button', { name: /filter by tag backend/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filter by tag ci/i })).toBeInTheDocument();
  });

  it('calls onFilterByTag when tag filter button is clicked', () => {
    const onFilterByTag = vi.fn<(tag: string) => void>();
    render(<ItemDetail item={item} onUpdate={() => {}} onFilterByTag={onFilterByTag} />);
    fireEvent.click(screen.getByRole('button', { name: /filter by tag backend/i }));
    expect(onFilterByTag).toHaveBeenCalledWith('backend');
  });

  it('marks tag as already filtered when it is in activeTags', () => {
    render(
      <ItemDetail
        item={item}
        onUpdate={() => {}}
        onFilterByTag={() => {}}
        activeTags={['backend']}
      />,
    );
    const alreadyFiltered = screen.getByRole('button', { name: /tag backend already in filter/i });
    expect(alreadyFiltered).toBeDisabled();
  });

  it('does not show filter buttons when onFilterByTag is not provided', () => {
    render(<ItemDetail item={item} onUpdate={() => {}} />);
    expect(screen.queryByRole('button', { name: /filter by tag/i })).not.toBeInTheDocument();
  });

  describe('LinkItem', () => {
    it('renders http URL as a clickable anchor with target=_blank', () => {
      render(<ItemDetail item={item} onUpdate={() => {}} />);
      const link = screen.getByRole('link', { name: /example\.com/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('renders work item ID as navigable — shows Open button', () => {
      render(<ItemDetail item={item} onUpdate={() => {}} onNavigate={() => {}} />);
      expect(screen.getByRole('button', { name: /open 20260102-bbbb/i })).toBeInTheDocument();
    });

    it('calls onNavigate with the ID when Open is clicked', () => {
      const onNavigate = vi.fn<(id: string) => void>();
      render(<ItemDetail item={item} onUpdate={() => {}} onNavigate={onNavigate} />);
      fireEvent.click(screen.getByRole('button', { name: /open 20260102-bbbb/i }));
      expect(onNavigate).toHaveBeenCalledWith('20260102-bbbb');
    });

    it('renders work item ID with a copy button', () => {
      render(<ItemDetail item={item} onUpdate={() => {}} onNavigate={() => {}} />);
      expect(screen.getByRole('button', { name: /copy link 20260102-bbbb/i })).toBeInTheDocument();
    });

    it('renders unknown string with a copy button but no Open button', () => {
      const itemWithArbitraryLink: WorkItem = {
        ...item,
        links: ['some-arbitrary-ref'],
      };
      render(<ItemDetail item={itemWithArbitraryLink} onUpdate={() => {}} onNavigate={() => {}} />);
      expect(screen.getByRole('button', { name: /copy link some-arbitrary-ref/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /open some-arbitrary-ref/i })).not.toBeInTheDocument();
    });

    it('renders work item ID as plain text (no Open button) when onNavigate is not provided', () => {
      render(<ItemDetail item={item} onUpdate={() => {}} />);
      expect(screen.queryByRole('button', { name: /open 20260102-bbbb/i })).not.toBeInTheDocument();
      // ID still visible as text
      expect(screen.getByText('20260102-bbbb')).toBeInTheDocument();
    });
  });
});
