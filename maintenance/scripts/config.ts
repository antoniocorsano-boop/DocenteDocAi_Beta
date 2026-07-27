/**
 * Phase 6: Maintenance & Monitoring Configuration
 * Configurazione soglie e regole per monitoraggio automatico
 *
 * @version 1.0.0
 * @date 2026-01-29
 */

export const MONITORING_CONFIG = {
  // Performance thresholds
  performance: {
    fps: {
      target: 60,
      warning: 45,
      critical: 30,
      regressionThreshold: 0.1 // 10% decrease
    },
    memory: {
      target: 0.7, // 70%
      warning: 0.8, // 80%
      critical: 0.9 // 90%
    },
    bundleSize: {
      regressionThreshold: 0.1, // 10% increase
      maxSize: 1000000 // 1MB
    }
  },

  // AI metrics thresholds
  ai: {
    responseTime: {
      target: 3000, // 3s
      warning: 5000, // 5s
      critical: 10000 // 10s
    },
    timeout: {
      threshold: 60000, // 60s
      maxRetries: 3
    },
    errorRate: {
      warning: 0.05, // 5%
      critical: 0.1 // 10%
    },
    quotaExceeded: {
      warning: 5, // per hour
      critical: 10 // per hour
    }
  },

  // Lazy loading thresholds
  lazyLoading: {
    loadTime: {
      target: 500, // 500ms
      warning: 1000, // 1s
      critical: 3000 // 3s
    },
    minComponents: 5 // Minimum lazy loaded components
  },

  // Alert cooldowns (minutes)
  alertCooldowns: {
    critical: 5,
    warning: 15,
    info: 60
  },

  // Reporting schedule
  reporting: {
    daily: {
      hour: 6,
      minute: 0
    },
    weekly: {
      day: 1, // Monday
      hour: 6,
      minute: 0
    }
  },

  // Data retention (days)
  retention: {
    logs: 30,
    reports: 90,
    alerts: 7
  },

  // Notification channels
  notifications: {
    console: {
      enabled: true,
      level: 'info' // debug, info, warning, critical
    },
    file: {
      enabled: true,
      path: 'maintenance/logs/alerts.log',
      level: 'warning'
    },
    email: {
      enabled: false, // Enable when configured
      to: ['dev-team@docentedoc.ai'],
      from: 'monitoring@docentedoc.ai',
      level: 'critical'
    },
    slack: {
      enabled: false, // Enable when configured
      webhook: 'https://hooks.slack.com/...',
      channel: '#alerts',
      level: 'warning'
    }
  },

  // Stop & Ask triggers
  stopAndAsk: {
    environmentChanges: true,
    criticalErrors: true,
    performanceRegression: 0.1, // 10%
    bundleSizeIncrease: 0.1, // 10%
    hotfixImpactsPriority1: true
  },

  // QA Checklist items
  qaChecklist: [
    'Monitoraggio performance attivo',
    'Log AI error configurato',
    'Alert trigger funzionanti',
    'Test automatici flussi principali (unit/integration/e2e)',
    'Test manuali lazy loading, memoization, accessibility',
    'Report performance generato',
    'Conferma QA checklist completata'
  ]
} as const;

// Export types for TypeScript
export type MonitoringConfig = typeof MONITORING_CONFIG;
export type AlertLevel = 'debug' | 'info' | 'warning' | 'critical';
export type NotificationChannel = keyof typeof MONITORING_CONFIG.notifications;