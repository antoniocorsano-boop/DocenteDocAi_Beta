/**
 * Phase 6: Maintenance & Monitoring - Alert Test Script
 * Script per testare il sistema di alert
 */

const fs = require('fs');
const path = require('path');

class AlertTester {
  constructor() {
    this.alertsLog = path.join(__dirname, '..', 'logs', 'alerts-test.log');
  }

  logAlert(type, title, message, data = {}) {
    const alert = {
      timestamp: new Date().toISOString(),
      type,
      title,
      message,
      data,
      test: true
    };

    const logEntry = `[${type.toUpperCase()}] ${title}: ${message}\n`;
    fs.appendFileSync(this.alertsLog, logEntry);

    console.log(`🔔 Test Alert: ${logEntry.trim()}`);
  }

  runAlertTests() {
    console.log('🧪 Running Phase 6 Alert System Tests...');

    // Test different alert types
    this.logAlert('info', 'Monitoring Started', 'Phase 6 monitoring system initialized');

    this.logAlert('warning', 'High Memory Usage', 'Memory usage at 85%', {
      memoryPercentage: 85,
      threshold: 80
    });

    this.logAlert('critical', 'AI Timeout Detected', 'AI response exceeded 60s timeout', {
      responseTime: 65000,
      timeoutThreshold: 60000
    });

    this.logAlert('warning', 'Bundle Size Increase', 'Bundle size increased by 12%', {
      increase: 0.12,
      threshold: 0.1
    });

    console.log('✅ Alert tests completed');
    console.log(`📝 Alerts logged to: ${this.alertsLog}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AlertTester();
  tester.runAlertTests();
}

module.exports = AlertTester;