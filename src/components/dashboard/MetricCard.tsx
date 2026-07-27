/**
 * MetricCard Component
 * Card per visualizzare singole metriche con trend e confronto baseline
 */

import React from 'react';
import { PerformanceMetrics } from '../../types/metrics';

// ============================================================================
// TYPES
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number; // percentage change from baseline
  status?: 'good' | 'warning' | 'critical' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getStatusColor = (status: MetricCardProps['status']) => {
  switch (status) {
    case 'good':
      return 'var(--md-sys-color-tertiary)';
    case 'warning':
      return 'var(--md-sys-color-secondary)';
    case 'critical':
      return 'var(--md-sys-color-error)';
    case 'neutral':
    default:
      return 'var(--md-sys-color-on-surface-variant)';
  }
};

const getTrendIcon = (trend?: number) => {
  if (!trend) return null;

  if (trend > 0) {
    return (
      <svg style={{width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)'}} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
      </svg>
    );
  } else if (trend < 0) {
    return (
      <svg style={{width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)'}} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.707-8.293l3 3a1 1 0 001.414 0l3-3a1 1 0 01-1.414-1.414L11 10.586V7a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 00-1.414 1.414z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg style={{width: 'var(--md-sys-spacing-4)', height: 'var(--md-sys-spacing-4)'}} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414l-3-3z" clipRule="evenodd" />
    </svg>
  );
};

const formatTrend = (trend?: number) => {
  if (!trend) return null;

  const sign = trend > 0 ? '+' : '';
  const color = trend > 0 ? 'var(--md-sys-color-error)' : trend < 0 ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-on-surface-variant)';

  return (
    <span style={{
      fontSize: 'var(--md-sys-typescale-body-large-font-size)',
      fontWeight: 'var(--md-sys-typescale-label-large-font-weight)',
      color: color,
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--md-sys-spacing-1)'
    }}>
      {getTrendIcon(trend)}
      {sign}{trend.toFixed(1)}%
    </span>
  );
};

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  status = 'neutral',
  icon,
  description
}) => {
  const statusColor = getStatusColor(status);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--md-sys-radius-3)',
        border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        padding: 'var(--md-sys-spacing-6)',
        boxShadow: 'var(--md-sys-elevation-1)',
        transition: 'box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard), border-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--md-sys-elevation-2)';
        e.currentTarget.style.borderColor = 'var(--md-sys-color-outline)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--md-sys-elevation-1)';
        e.currentTarget.style.borderColor = 'var(--md-sys-color-outline-variant)';
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 'var(--md-sys-spacing-4)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-3)'
        }}>
          {icon && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--md-sys-spacing-10)',
                height: 'var(--md-sys-spacing-10)',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                backgroundColor: statusColor + '15'
              }}
            >
              <div style={{ color: statusColor }}>
                {icon}
              </div>
            </div>
          )}
          <div>
            <h3 style={{
              fontSize: 'var(--md-sys-typescale-body-large-font-size)',
              fontWeight: 'var(--md-sys-typescale-label-large-font-weight)',
              color: 'var(--md-sys-color-on-surface-variant)',
              lineHeight: '1.25'
            }}>
              {title}
            </h3>
            {description && (
              <p style={{
                fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                color: 'var(--md-sys-color-on-surface-variant)',
                opacity: 'var(--md-sys-state-opacity-supporting)',
                marginTop: 'var(--md-sys-spacing-1)'
              }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Trend Indicator */}
        {trend !== undefined && (
          <div style={{
            flexShrink: '0'
          }}>
            {formatTrend(trend)}
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 'var(--md-sys-spacing-2)'
      }}>
        <span
          style={{
            fontSize: 'var(--md-sys-typescale-title-large-font-size)',
            fontWeight: 'var(--md-sys-typescale-weight-bold)',
            lineHeight: '1',
            color: 'var(--md-sys-color-on-surface)'
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span
            style={{
              fontSize: 'var(--md-sys-typescale-body-large-font-size)',
              fontWeight: 'var(--md-sys-typescale-label-large-font-weight)',
              color: 'var(--md-sys-color-on-surface-variant)'
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Status Indicator */}
      <div style={{
        position: 'absolute',
        top: 'var(--md-sys-spacing-4)',
        right: 'var(--md-sys-spacing-4)'
      }}>
        <div
          style={{
            width: 'var(--md-sys-spacing-2)',
            height: 'var(--md-sys-spacing-2)',
            borderRadius: 'var(--md-sys-shape-corner-full)',
            backgroundColor: statusColor
          }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// SPECIALIZED METRIC CARDS
// ============================================================================

export const FPSCard: React.FC<{ current: PerformanceMetrics; baseline?: PerformanceMetrics | null }> = ({
  current,
  baseline
}) => {
  const trend = baseline ? ((current.fps - baseline.fps) / baseline.fps) * 100 : undefined;
  const status = current.fps >= 55 ? 'good' : current.fps >= 30 ? 'warning' : 'critical';

  return (
    <MetricCard
      title="FPS Performance"
      value={Math.round(current.fps)}
      unit="fps"
      trend={trend}
      status={status}
      description="Frame rate dell'applicazione"
      icon={
        <svg style={{width: 'var(--md-sys-spacing-5)', height: 'var(--md-sys-spacing-5)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
    />
  );
};

export const MemoryCard: React.FC<{ current: PerformanceMetrics; baseline?: PerformanceMetrics | null }> = ({
  current,
  baseline
}) => {
  const trend = baseline ? ((current.memoryUsage.percentage - baseline.memoryUsage.percentage) / baseline.memoryUsage.percentage) * 100 : undefined;
  const status = current.memoryUsage.percentage <= 70 ? 'good' : current.memoryUsage.percentage <= 85 ? 'warning' : 'critical';

  return (
    <MetricCard
      title="Memory Usage"
      value={current.memoryUsage.percentage}
      unit="%"
      trend={trend}
      status={status}
      description={`${(current.memoryUsage.used / 1024 / 1024).toFixed(1)} MB / ${(current.memoryUsage.total / 1024 / 1024).toFixed(1)} MB`}
      icon={
        <svg style={{width: 'var(--md-sys-spacing-5)', height: 'var(--md-sys-spacing-5)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      }
    />
  );
};

export const BundleSizeCard: React.FC<{ current: PerformanceMetrics; baseline?: PerformanceMetrics | null }> = ({
  current,
  baseline
}) => {
  const trend = baseline ? ((current.bundleSize.total - baseline.bundleSize.total) / baseline.bundleSize.total) * 100 : undefined;
  const status = current.bundleSize.total <= 700000 ? 'good' : current.bundleSize.total <= 1000000 ? 'warning' : 'critical';

  return (
    <MetricCard
      title="Bundle Size"
      value={(current.bundleSize.total / 1024 / 1024).toFixed(2)}
      unit="MB"
      trend={trend}
      status={status}
      description={`${current.bundleSize.chunks} chunks`}
      icon={
        <svg style={{width: 'var(--md-sys-spacing-5)', height: 'var(--md-sys-spacing-5)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-9 0V1m10 3V1m0 3l1 1v16a2 2 0 01-2 2H6a2 2 0 01-2-2V5l1-1z" />
        </svg>
      }
    />
  );
};

export const AIMetricsCard: React.FC<{ current: PerformanceMetrics; baseline?: PerformanceMetrics | null }> = ({
  current,
  baseline
}) => {
  const trend = baseline ? ((current.aiMetrics.averageResponseTime - baseline.aiMetrics.averageResponseTime) / baseline.aiMetrics.averageResponseTime) * 100 : undefined;
  const hasErrors = current.aiMetrics.errorCount > 0 || current.aiMetrics.timeoutCount > 0 || current.aiMetrics.quotaExceededCount > 0;
  const status = !hasErrors && current.aiMetrics.averageResponseTime <= 3000 ? 'good' : hasErrors ? 'critical' : 'warning';

  return (
    <MetricCard
      title="AI Response Time"
      value={Math.round(current.aiMetrics.averageResponseTime)}
      unit="ms"
      trend={trend}
      status={status}
      description={`${current.aiMetrics.errorCount} errori, ${current.aiMetrics.timeoutCount} timeout`}
      icon={
        <svg style={{width: 'var(--md-sys-spacing-5)', height: 'var(--md-sys-spacing-5)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      }
    />
  );
};
