// ============================================================================
// METRICS TYPES - Frontend Compatible
// ============================================================================

export interface PerformanceMetrics {
  timestamp: string;
  fps: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  bundleSize: {
    total: number;
    chunks: number;
  };
  lazyLoading: {
    componentsLoaded: number;
    loadTimes: Record<string, number>;
  };
  aiMetrics: {
    averageResponseTime: number;
    timeoutCount: number;
    errorCount: number;
    quotaExceededCount: number;
  };
}

export interface AlertData {
  id: string;
  timestamp: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  acknowledged: boolean;
}

export interface DashboardMetrics {
  current: PerformanceMetrics;
  baseline: PerformanceMetrics | null;
  trend7d: PerformanceMetrics[];
  alerts: AlertData[];
}