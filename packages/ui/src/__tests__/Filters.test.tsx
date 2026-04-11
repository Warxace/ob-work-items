import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Filters } from '../components/Filters.js';
import type { ListParams } from '../types.js';

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
});
