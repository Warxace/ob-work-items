import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { Filters } from '../components/Filters.js';
import type { ListParams } from '../types.js';

/**
 * Stateful wrapper that mirrors how App.tsx uses Filters:
 * params live in state, onChange updates them so the next render
 * gives TagPicker the updated `selected` prop.
 * This catches stale-closure bugs where the second tag would overwrite
 * the first because `selected` was [] at both click moments.
 */
function StatefulFilters({
  initialParams = {},
  tags,
  onChange,
}: {
  initialParams?: ListParams;
  tags: string[];
  onChange: (p: ListParams) => void;
}) {
  const [params, setParams] = useState<ListParams>(initialParams);
  return (
    <Filters
      params={params}
      tags={tags}
      onChange={(p) => {
        setParams(p);
        onChange(p);
      }}
    />
  );
}

const noop = () => {};

describe('Filters', () => {
  it('renders search input', () => {
    render(<Filters params={{}} tags={[]} onChange={noop} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('calls onChange when search text changes', () => {
    const onChange = vi.fn<(p: ListParams) => void>();
    render(<Filters params={{}} tags={[]} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'bug' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ q: 'bug' }));
  });

  it('renders type filter dropdown', () => {
    render(<Filters params={{}} tags={[]} onChange={noop} />);
    expect(screen.getByRole('combobox', { name: /type/i })).toBeInTheDocument();
  });

  it('renders status filter dropdown', () => {
    render(<Filters params={{}} tags={[]} onChange={noop} />);
    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
  });

  it('renders priority filter dropdown', () => {
    render(<Filters params={{}} tags={[]} onChange={noop} />);
    expect(screen.getByRole('combobox', { name: /priority/i })).toBeInTheDocument();
  });

  it('calls onChange when type filter changes', () => {
    const onChange = vi.fn<(p: ListParams) => void>();
    render(<Filters params={{}} tags={[]} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox', { name: /type/i }), { target: { value: 'task' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'task' }));
  });

  it('renders TagPicker input', () => {
    render(<Filters params={{}} tags={['backend', 'frontend']} onChange={noop} />);
    expect(screen.getByRole('combobox', { name: /tag filter/i })).toBeInTheDocument();
  });

  it('shows selected tags as chips in TagPicker', () => {
    render(<Filters params={{ tags: ['backend', 'ci'] }} tags={['backend', 'ci', 'frontend']} onChange={noop} />);
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(screen.getByText('ci')).toBeInTheDocument();
  });

  it('calls onChange removing a tag when chip × is clicked', () => {
    const onChange = vi.fn<(p: ListParams) => void>();
    render(<Filters params={{ tags: ['backend', 'ci'] }} tags={['backend', 'ci', 'frontend']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /remove tag backend/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ tags: ['ci'] }));
  });

  it('shows active filter count badge including individual tag count', () => {
    // type=1, tags=[backend,ci]=2 → total 3
    render(<Filters params={{ type: 'task', tags: ['backend', 'ci'] }} tags={[]} onChange={noop} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders clear button when filters are active and calls onChange with empty params', () => {
    const onChange = vi.fn<(p: ListParams) => void>();
    render(<Filters params={{ type: 'task' }} tags={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith({});
  });

  describe('sequential tag selection (OR accumulation)', () => {
    it('accumulates both tags when two tags are selected one after another', () => {
      // Reproduces the bug scenario: selecting 'cad' then '3d-cad' should
      // result in tags: ['cad', '3d-cad'], NOT tags: ['3d-cad'] (stale closure).
      const onChange = vi.fn<(p: ListParams) => void>();
      render(
        <StatefulFilters
          tags={['cad', '3d-cad', 'backend']}
          onChange={onChange}
        />,
      );

      const input = screen.getByRole('combobox', { name: /tag filter/i });

      // Select first tag: focus input → pick 'cad' from dropdown
      fireEvent.focus(input);
      fireEvent.pointerDown(screen.getByRole('button', { name: 'cad' }));

      // After first selection, 'cad' chip is visible
      expect(screen.getByRole('button', { name: /remove tag cad/i })).toBeInTheDocument();

      // Select second tag: focus input again → pick '3d-cad' from dropdown
      fireEvent.focus(input);
      fireEvent.pointerDown(screen.getByRole('button', { name: '3d-cad' }));

      // Both chips must be visible (proves second tag was appended, not replaced)
      expect(screen.getByRole('button', { name: /remove tag cad/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove tag 3d-cad/i })).toBeInTheDocument();

      // The final onChange call must carry both tags
      const lastCall = onChange.mock.calls.at(-1)?.[0];
      expect(lastCall?.tags).toEqual(['cad', '3d-cad']);
    });

    it('selecting a third tag appends to the existing two', () => {
      const onChange = vi.fn<(p: ListParams) => void>();
      render(
        <StatefulFilters
          tags={['cad', '3d-cad', 'backend']}
          onChange={onChange}
        />,
      );

      const input = screen.getByRole('combobox', { name: /tag filter/i });

      fireEvent.focus(input);
      fireEvent.pointerDown(screen.getByRole('button', { name: 'cad' }));
      fireEvent.focus(input);
      fireEvent.pointerDown(screen.getByRole('button', { name: '3d-cad' }));
      fireEvent.focus(input);
      fireEvent.pointerDown(screen.getByRole('button', { name: 'backend' }));

      const lastCall = onChange.mock.calls.at(-1)?.[0];
      expect(lastCall?.tags).toEqual(['cad', '3d-cad', 'backend']);
    });
  });
});
