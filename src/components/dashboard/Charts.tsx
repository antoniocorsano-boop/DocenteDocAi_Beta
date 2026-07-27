/**
 * Charts Components
 * Components for displaying performance metrics charts using Recharts
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { PerformanceMetrics } from '../../types/metrics';

// ============================================================================
// TYPES
// ============================================================================

interface ChartProps {
  data: PerformanceMetrics[];
}

// ============================================================================
// PERFORMANCE TREND CHART
// ============================================================================

export const PerformanceTrendChart: React.FC<ChartProps> = ({
  data
}) => {
  // Transform data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((metric: PerformanceMetrics) => ({
      time: new Date(metric.timestamp).toLocaleDateString(),
      fps: Math.round(metric.fps),
      memory: Math.round(metric.memoryUsage.percentage),
      bundleSize: Math.round(metric.bundleSize.total / 1024 / 1024 * 100) / 100, // MB
      aiResponseTime: Math.round(metric.aiMetrics.averageResponseTime)
    }));
  }, [data]);

  if (!chartData.length) {
    return (
      <div
        style={{
          width: 'var(--md-sys-percent-100)',
          height: 'var(--md-sys-chart-height-large)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--md-sys-color-on-surface-variant)',
          fontSize: 'var(--md-sys-typescale-body-large-font-size)'
        }}
        role="status"
        aria-label="No performance data available"
      >
        No data available
      </div>
    );
  }

  return (
    <div
      style={{
        width: 'var(--md-sys-percent-100)',
        height: 'var(--md-sys-chart-height-large)'
      }}
      role="img"
      aria-label="Performance trend chart showing FPS and memory usage over time"
    >
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          aria-label="Performance metrics line chart"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--md-sys-color-outline-variant)"
          />
          <XAxis
            dataKey="time"
            stroke="var(--md-sys-color-on-surface-variant)"
            fontSize="var(--md-sys-typescale-body-large-font-size)"
          />
          <YAxis
            stroke="var(--md-sys-color-on-surface-variant)"
            fontSize="var(--md-sys-typescale-body-large-font-size)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              color: 'var(--md-sys-color-on-surface)'
            }}
          />
          <Line
            type="monotone"
            dataKey="fps"
            stroke="var(--md-sys-color-primary)"
            strokeWidth={2}
            dot={{ fill: 'var(--md-sys-color-primary)', strokeWidth: 2, r: 4 }}
            name="FPS"
          />
          <Line
            type="monotone"
            dataKey="memory"
            stroke="var(--md-sys-color-secondary)"
            strokeWidth={2}
            dot={{ fill: 'var(--md-sys-color-secondary)', strokeWidth: 2, r: 4 }}
            name="Memory %"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// MEMORY USAGE CHART
// ============================================================================

export const MemoryUsageChart: React.FC<ChartProps> = ({
  data
}) => {
  const chartData = data.map((metric: PerformanceMetrics) => ({
    time: new Date(metric.timestamp).toLocaleTimeString(),
    used: Math.round(metric.memoryUsage.used / 1024 / 1024), // MB
    percentage: metric.memoryUsage.percentage
  }));

  return (
    <div
      style={{
        width: 'var(--md-sys-percent-100)',
        height: 'var(--md-sys-chart-height-medium)' // Fixed height - use wrapper component for dynamic sizing
      }}
      role="img"
      aria-label="Memory usage chart showing used memory in MB and percentage over time"
    >
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          aria-label="Memory usage area chart"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--md-sys-color-outline-variant)"
          />
          <XAxis
            dataKey="time"
            stroke="var(--md-sys-color-on-surface-variant)"
            fontSize="var(--md-sys-typescale-body-large-font-size)"
          />
          <YAxis
            stroke="var(--md-sys-color-on-surface-variant)"
            fontSize="var(--md-sys-typescale-body-large-font-size)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              color: 'var(--md-sys-color-on-surface)'
            }}
          />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="var(--md-sys-color-tertiary)"
            fill="var(--md-sys-color-tertiary-container)"
            fillOpacity={0.3}
            name="Memory Usage %"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// AI ERRORS CHART
// ============================================================================

interface AIErrorsChartProps extends Omit<ChartProps, 'data'> {
  errorsByCategory: Record<string, number>;
}

export const AIErrorsChart: React.FC<AIErrorsChartProps> = ({
  errorsByCategory
}) => {
  const chartData = Object.entries(errorsByCategory).map(([category, count]) => ({
    name: category,
    value: count,
    fill: getErrorColor(category)
  }));

  // Check if we have valid data
  const hasValidData = chartData.length > 0 && chartData.some(item => item.value > 0);

  if (!hasValidData) {
    return (
      <div
        style={{
          width: 'var(--md-sys-percent-100)',
          height: 'var(--md-sys-chart-height-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--md-sys-color-on-surface-variant)',
          fontSize: 'var(--md-sys-typescale-body-large-font-size)'
        }}
        role="status"
        aria-label="No AI error data available"
      >
        No error data available
      </div>
    );
  }

  return (
    <div
      style={{
        width: 'var(--md-sys-percent-100)',
        height: 'var(--md-sys-chart-height-medium)' // Fixed height - use wrapper component for dynamic sizing
      }}
      role="img"
      aria-label="AI errors chart showing error count by category"
    >
      <ResponsiveContainer>
        <PieChart aria-label="AI errors pie chart">
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => {
              const percentage = percent && !isNaN(percent) ? (percent * 100).toFixed(0) : '0';
              return `${name} ${percentage}%`;
            }}
            outerRadius={80}
            fill="var(--md-sys-color-primary)"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              color: 'var(--md-sys-color-on-surface)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

function getErrorColor(category: string): string {
  const colors: Record<string, string> = {
    'Timeout': 'var(--md-sys-color-error)',
    'Quota Exceeded': 'var(--md-sys-color-error-container)',
    'Network Error': 'var(--md-sys-color-on-error-container)',
    'API Error': 'var(--md-sys-color-secondary)',
    'Rate Limit': 'var(--md-sys-color-tertiary)'
  };
  return colors[category] || 'var(--md-sys-color-outline-variant)';
}

// ============================================================================
// LAZY LOADING CHART
// ============================================================================

interface LazyLoadingChartProps extends Omit<ChartProps, 'data'> {
  loadTimes: Record<string, number>;
}

export const LazyLoadingChart: React.FC<LazyLoadingChartProps> = ({
  loadTimes
}) => {
  const chartData = Object.entries(loadTimes).map(([component, time]) => ({
    component: component.length > 15 ? component.substring(0, 15) + '...' : component,
    time: Math.round(time as number),
    fullName: component
  }));

  return (
    <div
      style={{
        width: 'var(--md-sys-percent-100)',
        height: 'var(--md-sys-chart-height-medium)' // Fixed height - use wrapper component for dynamic sizing
      }}
      role="img"
      aria-label="Lazy loading chart showing component load times in milliseconds"
    >
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="horizontal"
          aria-label="Lazy loading bar chart"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--md-sys-color-outline-variant)"
          />
          <XAxis
            type="number"
            stroke="var(--md-sys-color-on-surface-variant)"
            fontSize="var(--md-sys-typescale-body-large-font-size)"
          />
          <YAxis
            dataKey="component"
            type="category"
            stroke="var(--md-sys-color-on-surface-variant)"
            fontSize="var(--md-sys-typescale-body-large-font-size)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              color: 'var(--md-sys-color-on-surface)'
            }}
            formatter={(value, name, props) => [
              `${value}ms`,
              props.payload.fullName
            ]}
          />
          <Bar
            dataKey="time"
            fill="var(--md-sys-color-primary)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// BUNDLE SIZE TREND CHART
// ============================================================================

export const BundleSizeTrendChart: React.FC<ChartProps> = ({
  data
}) => {
  const chartData = data.map((metric: PerformanceMetrics) => ({
    time: new Date(metric.timestamp).toLocaleDateString(),
    bundleSize: Math.round(metric.bundleSize.total / 1024 / 1024 * 100) / 100, // MB
    chunks: metric.bundleSize.chunks
  }));

  return (
    <div
      style={{
        width: 'var(--md-sys-percent-100)',
        height: 'var(--md-sys-chart-height-medium)' // Fixed height - use wrapper component for dynamic sizing
      }}
      role="img"
      aria-label="Bundle size trend chart showing total bundle size in MB over time"
    >
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          aria-label="Bundle size trend line chart"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--md-sys-color-outline-variant)"
          />
          <XAxis
            dataKey="time"
            stroke="var(--md-sys-color-on-surface-variant)"
            fontSize="var(--md-sys-typescale-body-large-font-size)"
          />
          <YAxis
            stroke="var(--md-sys-color-on-surface-variant)"
            fontSize="var(--md-sys-typescale-body-large-font-size)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              color: 'var(--md-sys-color-on-surface)'
            }}
          />
          <Line
            type="monotone"
            dataKey="bundleSize"
            stroke="var(--md-sys-color-tertiary)"
            strokeWidth={2}
            dot={{ fill: 'var(--md-sys-color-tertiary)', strokeWidth: 2, r: 4 }}
            name="Bundle Size (MB)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
