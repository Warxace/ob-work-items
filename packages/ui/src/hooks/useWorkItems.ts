import { useState, useEffect, useCallback } from 'react';
import { fetchItems, fetchTags, fetchStats } from '../api.js';
import type { WorkItem, MetaStats, ListParams } from '../types.js';

export interface UseWorkItemsResult {
  items: WorkItem[];
  total: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Fetches the list of work items with given params. Re-fetches when params change. */
export function useWorkItems(params: ListParams): UseWorkItemsResult {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  // Stable key from params
  const key = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchItems(params)
      .then((data) => {
        if (!cancelled) {
          setItems(data.items);
          setTotal(data.total);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  return { items, total, loading, error, refresh };
}

export interface UseTagsResult {
  tags: string[];
  loading: boolean;
}

/** Fetches all unique tags. */
export function useTags(): UseTagsResult {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags()
      .then((data) => { setTags(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  return { tags, loading };
}

export interface UseStatsResult {
  stats: MetaStats | null;
  loading: boolean;
}

/** Fetches aggregated stats. */
export function useStats(): UseStatsResult {
  const [stats, setStats] = useState<MetaStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  return { stats, loading };
}
