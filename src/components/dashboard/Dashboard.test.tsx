/**
 * Dashboard Components Test
 * Test per verificare il funzionamento dei componenti dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { MetricCard } from './MetricCard';
import {
  useDashboardStore,
  useCurrentMetrics,
  useBaselineMetrics,
  useTrendData,
  useAlerts,
  useAIErrors,
  useLazyLoadingEfficiency,
  useIsLoading,
  useError,
  useLastUpdate
} from '../../stores/DashboardStore';

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

// Mock del store Zustand
vi.mock('../../stores/DashboardStore', () => ({
  useDashboardStore: vi.fn(),
  useAutoRefresh: vi.fn(),
  useCurrentMetrics: vi.fn(() => null),
  useBaselineMetrics: vi.fn(() => null),
  useTrendData: vi.fn(() => []),
  useAlerts: vi.fn(() => []),
  useAIErrors: vi.fn(() => ({})),
  useLazyLoadingEfficiency: vi.fn(() => null),
  useIsLoading: vi.fn(() => false),
  useError: vi.fn(() => null),
  useLastUpdate: vi.fn(() => null)
}));

describe('Dashboard Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MetricCard', () => {
    it('renders with basic props', () => {
      render(
        <MetricCard
          title="Test Metric"
          value="42"
          unit="units"
        />
      );

      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('units')).toBeInTheDocument();
    });

    it('renders with trend indicator', () => {
      render(
        <MetricCard
          title="Test Metric"
          value="42"
          unit="units"
          trend={5.2}
        />
      );

      expect(screen.getByText('+5.2%')).toBeInTheDocument();
    });

    it('renders with negative trend', () => {
      render(
        <MetricCard
          title="Test Metric"
          value="42"
          unit="units"
          trend={-3.1}
        />
      );

      expect(screen.getByText('-3.1%')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(
        <MetricCard
          title="Test Metric"
          value="42"
          description="This is a test metric"
        />
      );

      expect(screen.getByText('This is a test metric')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      const TestIcon = () => <svg data-testid="test-icon" />;
      render(
        <MetricCard
          title="Test Metric"
          value="42"
          icon={<TestIcon />}
        />
      );

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });
  });

describe('Dashboard', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      (useDashboardStore as any).mockReturnValue({
        fetchMetrics: vi.fn(),
        refresh: vi.fn(),
        toggleAutoRefresh: vi.fn(),
        autoRefresh: true,
        refreshInterval: 30000
      });
    });

    it('renders loading state', () => {
      (useIsLoading as any).mockReturnValue(true);
      (useCurrentMetrics as any).mockReturnValue(null);
      (useError as any).mockReturnValue(null);

      render(<Dashboard />);

      expect(screen.getByText('Caricamento dashboard...')).toBeInTheDocument();
    });

    it('renders error state', () => {
      (useIsLoading as any).mockReturnValue(false);
      (useCurrentMetrics as any).mockReturnValue(null);
      (useError as any).mockReturnValue('Test error message');

      render(<Dashboard />);

      expect(screen.getByText('Errore nel caricamento del dashboard')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('renders dashboard with data', () => {
      const mockMetrics = {
        timestamp: '2024-01-15T10:30:00Z',
        fps: 58,
        memoryUsage: {
          used: 45000000,
          total: 100000000,
          percentage: 45
        },
        bundleSize: {
          total: 600000,
          chunks: 15
        },
        lazyLoading: {
          componentsLoaded: 8,
          loadTimes: {
            'IdeaGeneratorModal': 120,
            'AnalyticsHub': 180
          }
        },
        aiMetrics: {
          averageResponseTime: 2500,
          timeoutCount: 0,
          errorCount: 0,
          quotaExceededCount: 0
        }
      };

      (useIsLoading as any).mockReturnValue(false);
      (useCurrentMetrics as any).mockReturnValue(mockMetrics);
      (useBaselineMetrics as any).mockReturnValue(null);
      (useTrendData as any).mockReturnValue([mockMetrics]);
      (useAlerts as any).mockReturnValue([]);
      (useAIErrors as any).mockReturnValue({});
      (useLazyLoadingEfficiency as any).mockReturnValue(null);
      (useError as any).mockReturnValue(null);
      (useLastUpdate as any).mockReturnValue(null);

      render(<Dashboard />);

      expect(screen.getByText('Dashboard Operativa')).toBeInTheDocument();
      expect(screen.getByText('FPS Performance')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Bundle Size')).toBeInTheDocument();
      expect(screen.getByText('AI Response Time')).toBeInTheDocument();
    });

    it('renders alerts section when alerts exist', () => {
      const mockMetrics = {
        timestamp: '2024-01-15T10:30:00Z',
        fps: 58,
        memoryUsage: { used: 45000000, total: 100000000, percentage: 45 },
        bundleSize: { total: 600000, chunks: 15 },
        lazyLoading: { componentsLoaded: 8, loadTimes: {} },
        aiMetrics: { averageResponseTime: 2500, timeoutCount: 0, errorCount: 0, quotaExceededCount: 0 }
      };

      const mockAlerts = [
        {
          id: '1',
          timestamp: '2024-01-15T10:30:00Z',
          type: 'critical' as const,
          title: 'High Memory Usage',
          message: 'Memory usage exceeded 90%',
          acknowledged: false
        }
      ];

      (useIsLoading as any).mockReturnValue(false);
      (useCurrentMetrics as any).mockReturnValue(mockMetrics);
      (useBaselineMetrics as any).mockReturnValue(null);
      (useTrendData as any).mockReturnValue([mockMetrics]);
      (useAlerts as any).mockReturnValue(mockAlerts);
      (useAIErrors as any).mockReturnValue({});
      (useLazyLoadingEfficiency as any).mockReturnValue(null);
      (useError as any).mockReturnValue(null);
      (useLastUpdate as any).mockReturnValue(null);

      render(<Dashboard />);

      expect(screen.getByText('Alert Attivi (1)')).toBeInTheDocument();
      expect(screen.getByText('High Memory Usage')).toBeInTheDocument();
    });
  });
});
