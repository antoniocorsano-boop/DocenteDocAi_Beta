/**
 * usePrefetch — warms bundle chunks for the most-likely next views.
 *
 * After a view has rendered, staggered dynamic imports trigger Vite to
 * fetch the adjacent route chunks in the background. This eliminates the
 * loading placeholder for common navigation patterns on slow connections.
 *
 * Adjacent views are defined in PREFETCH_MAP (viewRegistry.ts).
 * Prefetch is staggered (1.5 s base + 500 ms per view) so it never
 * competes with the user's current interaction.
 *
 * An optional `priorityView` (from useSmartNavigation) is prefetched first
 * at a reduced delay so the predicted next view is always fastest.
 *
 * Roadmap: #21 — Pre-fetch dati successivi per mobile smooth experience
 */
import { useEffect } from 'react';
import type { View } from '../types';
import { PREFETCH_MAP } from '../components/viewRegistry';

/**
 * Call inside any top-level component to prefetch adjacent view chunks.
 *
 * @param currentView  The currently active application view.
 * @param priorityView Optional predicted next view (from useSmartNavigation).
 *                     Its chunk is prefetched first with a shorter delay.
 */
export function usePrefetch(currentView: View, priorityView?: View | null): void {
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Priority: predicted next view at 800 ms
    if (priorityView && priorityView !== currentView) {
      const priorityLoaders = PREFETCH_MAP[priorityView];
      if (priorityLoaders && priorityLoaders.length > 0) {
        timeouts.push(
          setTimeout(() => {
            priorityLoaders[0]?.().catch(() => {});
          }, 800),
        );
      }
    }

    // Adjacency list: staggered from 1.5 s
    const loaders = PREFETCH_MAP[currentView];
    if (loaders && loaders.length > 0) {
      const BASE_DELAY_MS = 1500;
      const STAGGER_MS = 500;
      loaders.forEach((load, i) => {
        timeouts.push(
          setTimeout(() => {
            load().catch(() => {});
          }, BASE_DELAY_MS + i * STAGGER_MS),
        );
      });
    }

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [currentView, priorityView]);
}
