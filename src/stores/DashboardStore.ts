/**
 * Dashboard Operativa - Zustand Store
 * Gestione stato real-time per il dashboard di monitoraggio
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { DashboardMetrics, metricsParser, PerformanceMetrics, AlertData } from '../utils/metricsParser';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface DashboardState {
  // Data
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  lastUpdate: Date | null;
  error: string | null;

  // UI State
  selectedTimeRange: '1h' | '24h' | '7d' | '30d';
  autoRefresh: boolean;
  refreshInterval: number; // in milliseconds

  // Actions
  fetchMetrics: () => Promise<void>;
  setTimeRange: (range: '1h' | '24h' | '7d' | '30d') => void;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
  refresh: () => Promise<void>;
  clearError: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    metrics: null,
    isLoading: false,
    lastUpdate: null,
    error: null,
    selectedTimeRange: '24h',
    autoRefresh: true,
    refreshInterval: 30000, // 30 secondi

    // Actions
    fetchMetrics: async () => {
      set({ isLoading: true, error: null });

      try {
        const metrics = await metricsParser.getDashboardData();
        set({
          metrics,
          isLoading: false,
          lastUpdate: new Date(),
          error: null
        });
      } catch (error) {
        logger.error('Failed to fetch dashboard metrics:', error);
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch metrics',
          lastUpdate: new Date()
        });
      }
    },

    setTimeRange: (range) => {
      set({ selectedTimeRange: range });
      // In futuro, potrebbe triggerare un refetch con il nuovo range
    },

    toggleAutoRefresh: () => {
      const current = get().autoRefresh;
      set({ autoRefresh: !current });
    },

    setRefreshInterval: (interval) => {
      set({ refreshInterval: interval });
    },

    refresh: async () => {
      await get().fetchMetrics();
    },

    clearError: () => {
      set({ error: null });
    }
  }))
);

// ============================================================================
// AUTO-REFRESH HOOK
// ============================================================================

export const useAutoRefresh = (): void => {
  const { autoRefresh, refreshInterval, refresh } = useDashboardStore();

  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);
};

// ============================================================================
// SELECTORS
// ============================================================================

export const useMetrics = (): DashboardMetrics | null => useDashboardStore((state) => state.metrics);
export const useIsLoading = (): boolean => useDashboardStore((state) => state.isLoading);
export const useLastUpdate = (): Date | null => useDashboardStore((state) => state.lastUpdate);
export const useError = (): string | null => useDashboardStore((state) => state.error);
export const useTimeRange = (): '1h' | '24h' | '7d' | '30d' => useDashboardStore((state) => state.selectedTimeRange);
export const useAutoRefreshSettings = (): { autoRefresh: boolean; refreshInterval: number } => useDashboardStore((state) => ({
  autoRefresh: state.autoRefresh,
  refreshInterval: state.refreshInterval
}));

// ============================================================================
// COMPUTED SELECTORS
// ============================================================================

export const useCurrentMetrics = (): PerformanceMetrics | null => useDashboardStore((state) => state.metrics?.current || null);
export const useBaselineMetrics = (): PerformanceMetrics | null => useDashboardStore((state) => state.metrics?.baseline || null);
export const useTrendData = (): PerformanceMetrics[] => useDashboardStore((state) => state.metrics?.trend7d || []);
export const useAlerts = (): AlertData[] => useDashboardStore((state) => state.metrics?.alerts || []);
export const useAIErrors = (): Record<string, number> => useDashboardStore((state) => state.metrics?.aiErrorsByCategory || {});
export const useLazyLoadingEfficiency = (): { totalComponents: number; averageLoadTime: number; efficiency: number } | null => useDashboardStore((state) => state.metrics?.lazyLoadingEfficiency || null);

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useMetricsComparison = (): {
  fpsChange: number;
  memoryChange: number;
  bundleSizeChange: number;
  aiResponseTimeChange: number;
} | null => {
  const current = useCurrentMetrics();
  const baseline = useBaselineMetrics();

  if (!current || !baseline) return null;

  return {
    fpsChange: ((current.fps - baseline.fps) / baseline.fps) * 100,
    memoryChange: ((current.memoryUsage.percentage - baseline.memoryUsage.percentage) / baseline.memoryUsage.percentage) * 100,
    bundleSizeChange: ((current.bundleSize.total - baseline.bundleSize.total) / baseline.bundleSize.total) * 100,
    aiResponseTimeChange: ((current.aiMetrics.averageResponseTime - baseline.aiMetrics.averageResponseTime) / baseline.aiMetrics.averageResponseTime) * 100
  };
};

export const useAlertSummary = (): {
  total: number;
  critical: number;
  warning: number;
  info: number;
  unacknowledged: number;
} => {
  const alerts = useAlerts();

  return {
    total: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length
  };
};

// ============================================================================
// REACT IMPORT (for hooks)
// ============================================================================

import React from 'react';
import { logger } from '../utils/logger';