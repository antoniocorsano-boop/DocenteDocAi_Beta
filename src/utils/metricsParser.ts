/**
 * Dashboard Operativa - Metrics Parser
 * Utility per parsing metriche da log JSON e report
 */

import fs from 'fs';
import path from 'path';
import { logger } from './logger';

// ============================================================================
// TYPES & INTERFACES
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
  aiErrorsByCategory: Record<string, number>;
  lazyLoadingEfficiency: {
    totalComponents: number;
    averageLoadTime: number;
    efficiency: number; // 0-100
  };
}

// ============================================================================
// METRICS PARSER CLASS
// ============================================================================

export class MetricsParser {
  private logsDir: string;
  private reportsDir: string;

  constructor() {
    this.logsDir = path.join(process.cwd(), 'maintenance', 'logs');
    this.reportsDir = path.join(process.cwd(), 'maintenance', 'reports');
  }

  // ============================================================================
  // CURRENT METRICS
  // ============================================================================

  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    // In produzione, questo chiamerebbe monitoring.ts
    // Per ora, genera dati simulati basati su baseline
    const baseline = this.getBaselineMetrics();

    if (baseline) {
      // Simula variazioni realistiche attorno al baseline
      return {
        timestamp: new Date().toISOString(),
        fps: Math.max(30, baseline.fps + (Math.random() - 0.5) * 10),
        memoryUsage: {
          used: baseline.memoryUsage.used * (0.7 + Math.random() * 0.3),
          total: baseline.memoryUsage.total,
          percentage: Math.round((baseline.memoryUsage.percentage + (Math.random() - 0.5) * 20))
        },
        bundleSize: {
          total: baseline.bundleSize.total * (0.95 + Math.random() * 0.1),
          chunks: baseline.bundleSize.chunks
        },
        lazyLoading: {
          componentsLoaded: baseline.lazyLoading.componentsLoaded,
          loadTimes: Object.fromEntries(
            Object.entries(baseline.lazyLoading.loadTimes).map(([key, value]) => [
              key,
              value * (0.8 + Math.random() * 0.4)
            ])
          )
        },
        aiMetrics: {
          averageResponseTime: baseline.aiMetrics.averageResponseTime * (0.7 + Math.random() * 0.6),
          timeoutCount: Math.random() > 0.8 ? 1 : 0,
          errorCount: Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0,
          quotaExceededCount: Math.random() > 0.95 ? 1 : 0
        }
      };
    }

    // Fallback se non c'è baseline
    return {
      timestamp: new Date().toISOString(),
      fps: 58,
      memoryUsage: { used: 45 * 1024 * 1024, total: 100 * 1024 * 1024, percentage: 45 },
      bundleSize: { total: 600000, chunks: 15 },
      lazyLoading: {
        componentsLoaded: 8,
        loadTimes: { 'IdeaGeneratorModal': 120, 'AnalyticsHub': 180, 'UdaPlanner': 95, 'KnowledgeBase': 150 }
      },
      aiMetrics: { averageResponseTime: 2500, timeoutCount: 0, errorCount: 0, quotaExceededCount: 0 }
    };
  }

  // ============================================================================
  // BASELINE METRICS
  // ============================================================================

  getBaselineMetrics(): PerformanceMetrics | null {
    const baselinePath = path.join(this.logsDir, 'baseline.json');
    if (!fs.existsSync(baselinePath)) return null;

    try {
      return JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
    } catch (error) {
      logger.warn('Failed to load baseline metrics:', error);
      return null;
    }
  }

  // ============================================================================
  // TREND DATA (7 DAYS)
  // ============================================================================

  get7DayTrend(): PerformanceMetrics[] {
    const reports: PerformanceMetrics[] = [];

    // Simula dati degli ultimi 7 giorni
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      reports.push({
        timestamp: date.toISOString(),
        fps: 55 + Math.random() * 10,
        memoryUsage: {
          used: 40 * 1024 * 1024 + Math.random() * 20 * 1024 * 1024,
          total: 100 * 1024 * 1024,
          percentage: 40 + Math.random() * 20
        },
        bundleSize: { total: 590000 + Math.random() * 20000, chunks: 15 },
        lazyLoading: {
          componentsLoaded: 8,
          loadTimes: { 'IdeaGeneratorModal': 100 + Math.random() * 50, 'AnalyticsHub': 150 + Math.random() * 100 }
        },
        aiMetrics: {
          averageResponseTime: 2000 + Math.random() * 2000,
          timeoutCount: Math.random() > 0.9 ? 1 : 0,
          errorCount: Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0,
          quotaExceededCount: Math.random() > 0.95 ? 1 : 0
        }
      });
    }

    return reports;
  }

  // ============================================================================
  // ALERTS DATA
  // ============================================================================

  getRecentAlerts(hours: number = 24): AlertData[] {
    const alertsPath = path.join(this.logsDir, `${new Date().toISOString().split('T')[0]}-alerts.json`);
    if (!fs.existsSync(alertsPath)) return [];

    try {
      const data = fs.readFileSync(alertsPath, 'utf-8');
      const allAlerts: AlertData[] = data.trim() ? data.split('\n').map(line => JSON.parse(line)) : [];

      // Filtra per ultime ore
      const cutoff = Date.now() - (hours * 60 * 60 * 1000);
      return allAlerts.filter(alert => new Date(alert.timestamp).getTime() > cutoff);
    } catch (error) {
      logger.warn('Failed to load alerts:', error);
      return [];
    }
  }

  // ============================================================================
  // AI ERRORS BY CATEGORY
  // ============================================================================

  getAIErrorsByCategory(): Record<string, number> {
    // Simula distribuzione errori AI per categoria
    return {
      'Timeout': Math.floor(Math.random() * 10),
      'Quota Exceeded': Math.floor(Math.random() * 5),
      'Network Error': Math.floor(Math.random() * 8),
      'API Error': Math.floor(Math.random() * 6),
      'Rate Limit': Math.floor(Math.random() * 4)
    };
  }

  // ============================================================================
  // LAZY LOADING EFFICIENCY
  // ============================================================================

  getLazyLoadingEfficiency(): { totalComponents: number; averageLoadTime: number; efficiency: number } {
    const current = this.getBaselineMetrics();
    if (!current) {
      return { totalComponents: 8, averageLoadTime: 140, efficiency: 85 };
    }

    const loadTimes = Object.values(current.lazyLoading.loadTimes);
    const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;

    // Calcola efficienza (inferiore è meglio)
    const efficiency = Math.max(0, Math.min(100, 100 - (averageLoadTime - 100) / 2));

    return {
      totalComponents: current.lazyLoading.componentsLoaded,
      averageLoadTime: Math.round(averageLoadTime),
      efficiency: Math.round(efficiency)
    };
  }

  // ============================================================================
  // DASHBOARD DATA AGGREGATOR
  // ============================================================================

  async getDashboardData(): Promise<DashboardMetrics> {
    const [current, trend7d] = await Promise.all([
      this.getCurrentMetrics(),
      this.get7DayTrend()
    ]);

    return {
      current,
      baseline: this.getBaselineMetrics(),
      trend7d,
      alerts: this.getRecentAlerts(24),
      aiErrorsByCategory: this.getAIErrorsByCategory(),
      lazyLoadingEfficiency: this.getLazyLoadingEfficiency()
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  calculateRegression(current: number, baseline: number): number {
    return ((current - baseline) / baseline) * 100;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
}

// Export singleton instance
export const metricsParser = new MetricsParser();