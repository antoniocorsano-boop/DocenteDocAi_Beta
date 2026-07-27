// MD3 Compliant
/**
 * View Loading Utilities & Performance Tracking
 * 
 * This module provides utilities for:
 * - Tracking lazy view load times
 * - Prefetching view chunks before navigation
 * - Monitoring code-split performance
 * 
 * Views are already lazy-loaded via viewRegistry.ts using React.lazy()
 */

import type { View } from '../../types';
import { logger } from '../../utils/logger';

/**
 * View loading status and performance metrics tracker
 */
export const viewLoadingMetrics = {
  loaded: new Set<string>(),
  timestamps: new Map<string, number>(),
  
  markLoaded(viewName: string): void {
    this.loaded.add(viewName);
    this.timestamps.set(viewName, performance.now());
    logger.info(`[performance] View loaded: ${viewName}`);
  },
  
  getLoadTime(viewName: string): number | null {
    return this.timestamps.get(viewName) ?? null;
  }
};

/**
 * List of heavy views that should be lazy-loaded
 * These views contain large dependencies (PDFs, complex components, etc.)
 */
export const LAZY_VIEW_LIST: View[] = [
  'reportistica',
  'calendario',
  'progettazione-hub',
  'settings',
  'orientamento',
];

/**
 * List of core views that should remain in main bundle
 * These are entry points or frequently accessed views
 */
export const MAIN_BUNDLE_VIEWS: View[] = [
  'home',
  'aula',
  'studenti',
  'register',
  'evaluations',
  'studio',
];

/**
 * Preload a view chunk (useful for route prefetching)
 * This triggers dynamic import of heavy views like PDFs, Calendar, etc.
 * @param viewName - Name of view to preload
 */
const VIEW_IMPORTERS: Partial<Record<View, () => Promise<unknown>>> = {
  reportistica: () => import('../ReportisticaHub'),
  calendario: () => import('../Calendar'),
  'progettazione-hub': () => import('../ProgettazioneHub'),
  settings: () => import('../Settings'),
  orientamento: () => import('../OrientamentoDashboard')
};

export function preloadView(viewName: View): void {
  if (!LAZY_VIEW_LIST.includes(viewName)) {
    return;
  }

  const importer = VIEW_IMPORTERS[viewName];
  if (!importer) {
    logger.warn(`[lazy-load] No importer registered for view: ${viewName}`);
    return;
  }

  importer()
    .then(() => {
      viewLoadingMetrics.markLoaded(viewName);
    })
    .catch(err => {
      logger.warn(`[lazy-load] Failed to preload view: ${viewName}`, err);
    });
}

