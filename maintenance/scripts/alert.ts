/**
 * Phase 6: Maintenance & Monitoring
 * Sistema di alert automatici per notifiche critiche
 *
 * @version 1.0.0
 * @date 2026-01-29
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'fs';
import path from 'path';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AlertRule {
  id: string;
  name: string;
  condition: (data: any) => boolean;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  cooldown: number; // minutes
  lastTriggered?: number;
}

interface AlertNotification {
  id: string;
  timestamp: string;
  ruleId: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  data: unknown;
  acknowledged: boolean;
}

interface NotificationChannel {
  type: 'console' | 'file' | 'email' | 'slack';
  enabled: boolean;
  config?: {
    webhookUrl?: string;
    emailTo?: string;
    filePath?: string;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const ALERT_RULES: AlertRule[] = [
  {
    id: 'runtime-crash',
    name: 'Runtime Crash Detection',
    condition: (data: any) => data.type === 'error' && data.stackTrace,
    severity: 'critical',
    message: 'Application runtime crash detected',
    cooldown: 5
  },
  {
    id: 'ai-timeout-excessive',
    name: 'AI Timeout Excessive',
    condition: (data: any) => data.aiMetrics?.averageResponseTime > 60000,
    severity: 'critical',
    message: 'AI response time exceeds 60s threshold',
    cooldown: 10
  },
  {
    id: 'ai-quota-exceeded',
    name: 'AI Quota Exceeded',
    condition: (data: any) => data.aiMetrics?.quotaExceededCount > 5,
    severity: 'warning',
    message: 'High rate of AI quota exceeded errors',
    cooldown: 30
  },
  {
    id: 'performance-regression',
    name: 'Performance Regression',
    condition: (data: any) => data.fps && data.fps < 30,
    severity: 'warning',
    message: 'FPS dropped below 30, potential performance regression',
    cooldown: 15
  },
  {
    id: 'memory-high-usage',
    name: 'High Memory Usage',
    condition: (data: any) => data.memoryUsage?.percentage > 90,
    severity: 'warning',
    message: 'Memory usage exceeds 90%',
    cooldown: 20
  },
  {
    id: 'bundle-size-increase',
    name: 'Bundle Size Increase',
    condition: (data: any) => data.bundleSizeIncrease > 0.1,
    severity: 'info',
    message: 'Bundle size increased by more than 10%',
    cooldown: 60
  }
];

const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  {
    type: 'console',
    enabled: true
  },
  {
    type: 'file',
    enabled: true,
    config: {
      filePath: path.join(process.cwd(), 'maintenance', 'logs', 'alerts.log')
    }
  }
  // Email and Slack channels can be added when configured
];

// ============================================================================
// ALERT MANAGER CLASS
// ============================================================================

class AlertManager {
  private notifications: AlertNotification[] = [];
  private lastTriggerTimes: Map<string, number> = new Map();

  constructor() {
    this.loadPersistedState();
  }

  private loadPersistedState(): void {
    const stateFile = path.join(process.cwd(), 'maintenance', 'logs', 'alert-state.json');
    if (fs.existsSync(stateFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        this.lastTriggerTimes = new Map(state.lastTriggerTimes || []);
        this.notifications = state.notifications || [];
      } catch (error) {
        console.warn('Failed to load alert state:', error);
      }
    }
  }

  private savePersistedState(): void {
    const stateFile = path.join(process.cwd(), 'maintenance', 'logs', 'alert-state.json');
    const state = {
      lastTriggerTimes: Array.from(this.lastTriggerTimes.entries()),
      notifications: this.notifications.slice(-100) // Keep last 100 notifications
    };
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  }

  // ============================================================================
  // ALERT PROCESSING
  // ============================================================================

  processData(data: unknown, source: string = 'unknown'): void {
    ALERT_RULES.forEach(rule => {
      if (this.shouldTriggerAlert(rule, data)) {
        this.triggerAlert(rule, data, source);
      }
    });
  }

  private shouldTriggerAlert(rule: AlertRule, data: unknown): boolean {
    // Check condition
    if (!rule.condition(data)) {
      return false;
    }

    // Check cooldown
    const lastTriggered = this.lastTriggerTimes.get(rule.id);
    if (lastTriggered) {
      const cooldownMs = rule.cooldown * 60 * 1000; // Convert minutes to ms
      const timeSinceLastTrigger = Date.now() - lastTriggered;
      if (timeSinceLastTrigger < cooldownMs) {
        return false;
      }
    }

    return true;
  }

  private triggerAlert(rule: AlertRule, data: unknown, source: string): void {
    const notification: AlertNotification = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: this.formatMessage(rule.message, data),
      data: { ...(typeof data === 'object' && data !== null ? data : {}), source },
      acknowledged: false
    };

    this.notifications.push(notification);
    this.lastTriggerTimes.set(rule.id, Date.now());
    this.savePersistedState();

    // Send notifications
    this.sendNotifications(notification);
  }

  private formatMessage(template: string, data: any): string {
    // Simple template replacement
    let message = template;

    if (data.fps) message = message.replace('{fps}', data.fps.toString());
    if (data.memoryUsage?.percentage) message = message.replace('{memory}', data.memoryUsage.percentage.toString());
    if (data.aiMetrics?.averageResponseTime) message = message.replace('{time}', data.aiMetrics.averageResponseTime.toString());
    if (data.bundleSizeIncrease) message = message.replace('{increase}', (data.bundleSizeIncrease * 100).toFixed(1));

    return message;
  }

  // ============================================================================
  // NOTIFICATION CHANNELS
  // ============================================================================

  private sendNotifications(notification: AlertNotification): void {
    NOTIFICATION_CHANNELS.forEach(channel => {
      if (!channel.enabled) return;

      switch (channel.type) {
        case 'console':
          this.sendConsoleNotification(notification);
          break;
        case 'file':
          this.sendFileNotification(notification, channel);
          break;
        case 'email':
          this.sendEmailNotification(notification, channel);
          break;
        case 'slack':
          this.sendSlackNotification(notification, channel);
          break;
      }
    });
  }

  private sendConsoleNotification(notification: AlertNotification): void {
    const severityEmoji = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    };

    console.log(`${severityEmoji[notification.severity]} [${notification.severity.toUpperCase()}] ${notification.title}`);
    console.log(`   ${notification.message}`);
    console.log(`   Time: ${notification.timestamp}`);
    console.log(`   ID: ${notification.id}`);
    console.log('');
  }

  private sendFileNotification(notification: AlertNotification, channel: NotificationChannel): void {
    if (!channel.config?.filePath) return;

    const logEntry = JSON.stringify({
      ...notification,
      channel: 'file'
    }) + '\n';

    try {
      fs.appendFileSync(channel.config.filePath, logEntry);
    } catch (error) {
      console.error('Failed to write alert to file:', error);
    }
  }

  private sendEmailNotification(notification: AlertNotification, channel: NotificationChannel): void {
    // Placeholder for email implementation
    // Would integrate with nodemailer or similar
    console.log(`📧 Email notification would be sent to: ${channel.config?.emailTo || 'configured address'}`);
    console.log(`   Subject: ${notification.title}`);
    console.log(`   Body: ${notification.message}`);
  }

  private sendSlackNotification(notification: AlertNotification, channel: NotificationChannel): void {
    // Placeholder for Slack implementation
    // Would use Slack Web API or webhook
    console.log(`💬 Slack notification would be sent to webhook`);
    console.log(`   Title: ${notification.title}`);
    console.log(`   Message: ${notification.message}`);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getActiveAlerts(): AlertNotification[] {
    return this.notifications.filter(n => !n.acknowledged);
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.notifications.find(n => n.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.savePersistedState();
      return true;
    }
    return false;
  }

  getAlertHistory(hours: number = 24): AlertNotification[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.notifications.filter(n =>
      new Date(n.timestamp).getTime() > cutoff
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  simulateAlert(ruleId: string, testData: Record<string, unknown> = {}): void {
    const rule = ALERT_RULES.find(r => r.id === ruleId);
    if (!rule) {
      console.error(`Alert rule '${ruleId}' not found`);
      return;
    }

    console.log(`🧪 Simulating alert: ${rule.name}`);
    this.triggerAlert(rule, testData, 'simulation');
  }

  getAlertStats(): { total: number; bySeverity: Record<string, number>; recent: number } {
    const recent = this.getAlertHistory(24);
    const bySeverity = recent.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.notifications.length,
      bySeverity,
      recent: recent.length
    };
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const alertManager = new AlertManager();

  const command = process.argv[2];

  switch (command) {
    case 'stats':
      const stats = alertManager.getAlertStats();
      console.log('Alert Statistics (last 24h):');
      console.log(`Total alerts: ${stats.total}`);
      console.log(`Recent alerts: ${stats.recent}`);
      console.log('By severity:', stats.bySeverity);
      break;

    case 'active':
      const active = alertManager.getActiveAlerts();
      console.log(`Active alerts: ${active.length}`);
      active.forEach(alert => {
        console.log(`- ${alert.title} (${alert.severity})`);
      });
      break;

    case 'simulate':
      const ruleId = process.argv[3];
      if (!ruleId) {
        console.log('Usage: ts-node alert.ts simulate <rule-id>');
        console.log('Available rules:', ALERT_RULES.map(r => r.id).join(', '));
        return;
      }
      alertManager.simulateAlert(ruleId);
      break;

    case 'acknowledge':
      const alertId = process.argv[3];
      if (!alertId) {
        console.log('Usage: ts-node alert.ts acknowledge <alert-id>');
        return;
      }
      const acknowledged = alertManager.acknowledgeAlert(alertId);
      console.log(acknowledged ? 'Alert acknowledged' : 'Alert not found');
      break;

    default:
      console.log('Usage: ts-node alert.ts <command>');
      console.log('Commands:');
      console.log('  stats       - Show alert statistics');
      console.log('  active      - Show active alerts');
      console.log('  simulate    - Simulate an alert (for testing)');
      console.log('  acknowledge - Acknowledge an alert');
      break;
  }
}

// Export for use in other modules
export { AlertManager, type AlertRule, type AlertNotification, type NotificationChannel };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
