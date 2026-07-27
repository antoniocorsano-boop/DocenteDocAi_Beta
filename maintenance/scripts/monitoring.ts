/**
 * Phase 6: Maintenance & Monitoring
 * Script automatizzato per raccolta metriche performance e monitoraggio
 *
 * @version 1.0.0
 * @date 2026-01-29
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface PerformanceMetrics {
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

interface UserFeedback {
  timestamp: string;
  type: 'error' | 'performance' | 'ux' | 'ai';
  message: string;
  userAgent: string;
  url: string;
  stackTrace?: string;
  aiContext?: {
    prompt: string;
    responseTime: number;
    errorType?: string;
  };
}

interface AlertConfig {
  performanceThreshold: number; // 10% regression
  bundleSizeThreshold: number; // 10% increase
  aiTimeoutThreshold: number; // 60s
  errorRateThreshold: number; // 5% of requests
}

interface MonitoringReport {
  date: string;
  period: 'daily' | 'weekly';
  metrics: PerformanceMetrics[];
  feedback: UserFeedback[];
  alerts: Alert[];
  recommendations: string[];
}

interface Alert {
  id: string;
  timestamp: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  data: unknown;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG: AlertConfig = {
  performanceThreshold: 0.1, // 10%
  bundleSizeThreshold: 0.1, // 10%
  aiTimeoutThreshold: 60000, // 60s
  errorRateThreshold: 0.05, // 5%
};

const LOG_DIR = path.join(process.cwd(), 'maintenance', 'logs');
const REPORT_DIR = path.join(process.cwd(), 'maintenance', 'reports');

// ============================================================================
// MONITORING CLASS
// ============================================================================

class MaintenanceMonitor {
  private baselineMetrics: PerformanceMetrics | null = null;
  private alerts: Alert[] = [];

  constructor() {
    this.ensureDirectories();
    this.loadBaseline();
  }

  private ensureDirectories(): void {
    [LOG_DIR, REPORT_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private loadBaseline(): void {
    const baselinePath = path.join(LOG_DIR, 'baseline.json');
    if (fs.existsSync(baselinePath)) {
      try {
        this.baselineMetrics = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      } catch (error) {
        console.warn('Failed to load baseline metrics:', error);
      }
    }
  }

  private saveBaseline(metrics: PerformanceMetrics): void {
    const baselinePath = path.join(LOG_DIR, 'baseline.json');
    fs.writeFileSync(baselinePath, JSON.stringify(metrics, null, 2));
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    const timestamp = new Date().toISOString();

    // Simulate performance data collection (in real implementation, this would use browser APIs)
    const metrics: PerformanceMetrics = {
      timestamp,
      fps: 60, // Would be measured from React DevTools
      memoryUsage: {
        used: 45 * 1024 * 1024, // 45MB
        total: 100 * 1024 * 1024, // 100MB
        percentage: 45
      },
      bundleSize: {
        total: 600000, // 600KB
        chunks: 15
      },
      lazyLoading: {
        componentsLoaded: 8,
        loadTimes: {
          'IdeaGeneratorModal': 120,
          'AnalyticsHub': 180,
          'UdaPlanner': 95,
          'KnowledgeBase': 150
        }
      },
      aiMetrics: {
        averageResponseTime: 2500, // 2.5s
        timeoutCount: 0,
        errorCount: 2,
        quotaExceededCount: 0
      }
    };

    // Check for regressions
    if (this.baselineMetrics) {
      this.checkPerformanceRegressions(metrics);
    } else {
      this.saveBaseline(metrics);
    }

    return metrics;
  }

  private checkPerformanceRegressions(current: PerformanceMetrics): void {
    if (!this.baselineMetrics) return;

    const baseline = this.baselineMetrics;

    // Check FPS regression
    const fpsRegression = (baseline.fps - current.fps) / baseline.fps;
    if (fpsRegression > CONFIG.performanceThreshold) {
      this.createAlert('warning', 'FPS Regression Detected',
        `FPS decreased by ${(fpsRegression * 100).toFixed(1)}% from baseline ${baseline.fps} to ${current.fps}`);
    }

    // Check bundle size increase
    const bundleRegression = (current.bundleSize.total - baseline.bundleSize.total) / baseline.bundleSize.total;
    if (bundleRegression > CONFIG.bundleSizeThreshold) {
      this.createAlert('warning', 'Bundle Size Increase',
        `Bundle size increased by ${(bundleRegression * 100).toFixed(1)}% from ${baseline.bundleSize.total} to ${current.bundleSize.total} bytes`);
    }

    // Check AI response time regression
    const aiRegression = (current.aiMetrics.averageResponseTime - baseline.aiMetrics.averageResponseTime) / baseline.aiMetrics.averageResponseTime;
    if (aiRegression > CONFIG.performanceThreshold) {
      this.createAlert('warning', 'AI Response Time Regression',
        `AI response time increased by ${(aiRegression * 100).toFixed(1)}% from ${baseline.aiMetrics.averageResponseTime}ms to ${current.aiMetrics.averageResponseTime}ms`);
    }
  }

  // ============================================================================
  // USER FEEDBACK COLLECTION
  // ============================================================================

  logUserFeedback(feedback: Omit<UserFeedback, 'timestamp'>): void {
    const feedbackEntry: UserFeedback = {
      ...feedback,
      timestamp: new Date().toISOString()
    };

    const logFile = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}-feedback.json`);
    this.appendToLogFile(logFile, feedbackEntry);

    // Check for critical errors
    if (feedback.type === 'error') {
      this.createAlert('critical', 'Runtime Error Detected',
        `User reported error: ${feedback.message}`, feedback);
    }
  }

  // ============================================================================
  // ALERT SYSTEM
  // ============================================================================

  private createAlert(type: Alert['type'], title: string, message: string, data?: unknown): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      message,
      data
    };

    this.alerts.push(alert);

    // Log alert
    const alertLog = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}-alerts.json`);
    this.appendToLogFile(alertLog, alert);

    // Console output for immediate visibility
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  }

  // ============================================================================
  // REPORTING
  // ============================================================================

  async generateDailyReport(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const metrics = await this.collectPerformanceMetrics();

    const report: MonitoringReport = {
      date: today,
      period: 'daily',
      metrics: [metrics],
      feedback: this.loadFeedbackForDate(today),
      alerts: this.alerts.filter(a => a.timestamp.startsWith(today)),
      recommendations: this.generateRecommendations(metrics)
    };

    const reportPath = path.join(REPORT_DIR, `${today}-daily-report.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`Daily report generated: ${reportPath}`);
  }

  private loadFeedbackForDate(date: string): UserFeedback[] {
    const feedbackFile = path.join(LOG_DIR, `${date}-feedback.json`);
    if (!fs.existsSync(feedbackFile)) return [];

    try {
      const data = fs.readFileSync(feedbackFile, 'utf-8');
      return data.trim() ? data.split('\n').map(line => JSON.parse(line)) : [];
    } catch (error) {
      console.warn('Failed to load feedback for date:', date, error);
      return [];
    }
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.aiMetrics.averageResponseTime > 5000) {
      recommendations.push('Consider implementing AI response caching for frequently asked prompts');
    }

    if (metrics.memoryUsage.percentage > 80) {
      recommendations.push('High memory usage detected. Review component memoization and lazy loading implementation');
    }

    if (metrics.lazyLoading.componentsLoaded < 5) {
      recommendations.push('Limited lazy loading detected. Consider lazy loading more heavy components');
    }

    if (metrics.aiMetrics.errorCount > 5) {
      recommendations.push('High AI error rate. Review API error handling and retry logic');
    }

    return recommendations;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private appendToLogFile(filePath: string, data: unknown): void {
    const entry = JSON.stringify(data) + '\n';
    fs.appendFileSync(filePath, entry);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  async runMonitoringCycle(): Promise<void> {
    console.log('🚀 Starting Phase 6 Maintenance Monitoring Cycle...');

    const metrics = await this.collectPerformanceMetrics();
    console.log('✅ Performance metrics collected');

    await this.generateDailyReport();
    console.log('✅ Daily report generated');

    if (this.alerts.length > 0) {
      console.log(`⚠️  ${this.alerts.length} alerts generated`);
    }

    console.log('🎯 Phase 6 monitoring cycle completed');
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const monitor = new MaintenanceMonitor();

  const command = process.argv[2];

  switch (command) {
    case 'run':
      await monitor.runMonitoringCycle();
      break;

    case 'report':
      await monitor.generateDailyReport();
      break;

    case 'baseline':
      const metrics = await monitor.collectPerformanceMetrics();
      console.log('Baseline metrics collected and saved');
      break;

    default:
      console.log('Usage: ts-node monitoring.ts <command>');
      console.log('Commands:');
      console.log('  run      - Run full monitoring cycle');
      console.log('  report   - Generate daily report');
      console.log('  baseline - Collect and save baseline metrics');
      break;
  }
}

// Export for use in other modules
export { MaintenanceMonitor, type PerformanceMetrics, type UserFeedback, type Alert };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}