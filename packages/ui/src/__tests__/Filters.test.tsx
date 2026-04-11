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

  it('renders type filter options', () => {
    render(<Filters params={{}} tags={[]} onChange={noop} />);
    expect(screen.getByRole('combobox', { name: /type/i })).toBeInTheDocument();
  });

  it('renders status filter options', () => {
    render(<Filters params={{}} tags={[]} onChange={noop} />);
    expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
  });

  it('renders priority filter options', () => {
    render(<Filters params={{}} tags={[]} onChange={noop} />);
    expect(screen.getByRole('combobox', { name: /priority/i })).toBeInTheDocument();
  });

  it('calls onChange when type filter changes', () => {
    const onChange = vi.fn<(p: ListParams) => void>();
    render(<Filters params={{}} tags={[]} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox', { name: /type/i }), { target: { value: 'task' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'task' }));
  });

  it('shows active filter count badge', () => {
    render(<Filters params={{ type: 'task', status: 'open' }} tags={[]} onChange={noop} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders clear button when filters are active and calls onChange with empty params', () => {
    const onChange = vi.fn<(p: ListParams) => void>();
    render(<Filters params={{ type: 'task' }} tags={[]} onChange={onChange} />);
    const clearBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith({});
  });
});
