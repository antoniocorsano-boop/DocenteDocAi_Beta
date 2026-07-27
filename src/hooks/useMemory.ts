/**
 * hooks/useMemory.ts — Memory Layer client hook (P31)
 *
 * Provides a React interface for the /memory API:
 *   save(content, metadata)  — persist a memory entry
 *   load(limit)              — fetch recent entries for current user
 *   search(query, limit)     — semantic similarity search (P31)
 *   entries                  — reactive state array
 *   loading                  — boolean pending flag
 *
 * Usage:
 *   const { entries, loading, save, load, search } = useMemory();
 *   useEffect(() => { load(20); }, [load]);
 */

import { useState, useCallback } from 'react';
import { saveMemory, fetchMemory, searchMemory } from '@/services/agentApiClient';
import type { MemoryEntry, MemorySearchResult }  from '@/services/agentApiClient';

export type { MemorySearchResult };

export interface UseMemoryReturn {
  entries: MemoryEntry[];
  loading: boolean;
  /** Persist a memory entry. Returns the new entry id, or null on failure. */
  save:    (content: string, metadata?: Record<string, unknown>) => Promise<string | null>;
  /** Load recent entries from the server into `entries`. */
  load:    (limit?: number) => Promise<void>;
  /** Semantic similarity search over the current user's memory (P31). */
  search:  (query: string, limit?: number) => Promise<MemorySearchResult[]>;
}

export function useMemory(): UseMemoryReturn {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const save = useCallback(async (content: string, metadata?: Record<string, unknown>): Promise<string | null> => {
    const result = await saveMemory(content, metadata);
    return result?.id ?? null;
  }, []);

  const load = useCallback(async (limit = 20): Promise<void> => {
    setLoading(true);
    try {
      const data = await fetchMemory(limit);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string, limit = 5): Promise<MemorySearchResult[]> => {
    return searchMemory(query, limit);
  }, []);

  return { entries, loading, save, load, search };
}
