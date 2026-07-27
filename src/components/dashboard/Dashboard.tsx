/**
 * Dashboard Operativa - Main Component
 * Dashboard principale per il monitoraggio delle performance
 */

import React, { useEffect } from 'react';
import {
  useDashboardStore,
  useAutoRefresh,
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
import { FPSCard, MemoryCard, BundleSizeCard, AIMetricsCard } from './MetricCard';
import {
  PerformanceTrendChart,
  MemoryUsageChart,
  AIErrorsChart,
  LazyLoadingChart,
  BundleSizeTrendChart
} from './Charts';

// ============================================================================
// DASHBOARD HEADER
// ============================================================================

const DashboardHeader: React.FC = () => {
  const { refresh, toggleAutoRefresh, autoRefresh } = useDashboardStore();
  const lastUpdate = useLastUpdate();
  const isLoading = useIsLoading();

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Mai aggiornato';
    return `Aggiornato ${date.toLocaleTimeString()}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--md-sys-spacing-6)'
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 'var(--md-sys-typescale-headline-large-font-size)',
            fontWeight: 'var(--md-sys-typescale-headline-large-font-weight)',
            lineHeight: 'var(--md-sys-typescale-title-large-font-size-line-height)',
            marginBottom: 'var(--md-sys-spacing-2)',
            color: 'var(--md-sys-color-on-surface)'
          }}
        >
          Dashboard Operativa
        </h1>
        <p
          style={{
            fontSize: 'var(--md-sys-typescale-body-large-font-size)',
            fontWeight: 'var(--md-sys-typescale-body-large-font-weight)',
            lineHeight: 'var(--md-sys-typescale-body-large-line-height)',
            color: 'var(--md-sys-color-on-surface-variant)'
          }}
        >
          Monitoraggio real-time delle performance di DocenteDoc AI
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-4)'
        }}
      >
        {/* Auto Refresh Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-2)'
          }}
        >
          <label
            style={{
              fontSize: 'var(--md-sys-typescale-body-medium-font-size)',
              fontWeight: 'var(--md-sys-typescale-body-medium-font-weight)',
              lineHeight: 'var(--md-sys-typescale-body-large-line-height)',
              color: 'var(--md-sys-color-on-surface-variant)',
              cursor: 'pointer'
            }}
          >
            Auto refresh
          </label>
          <button
            onClick={toggleAutoRefresh}
            style={{
              position: 'relative',
              display: 'inline-flex',
              height: 'var(--md-sys-spacing-6)',
              width: 'var(--md-sys-spacing-11)',
              alignItems: 'center',
              borderRadius: 'var(--md-sys-radius-3)',
              transition: 'background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
              backgroundColor: autoRefresh ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                height: 'var(--md-sys-spacing-4)',
                width: 'var(--md-sys-spacing-4)',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                backgroundColor: 'var(--md-sys-color-on-primary)',
                transition: 'transform var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
                transform: autoRefresh ? 'translateX(var(--md-sys-spacing-5))' : 'translateX(var(--md-sys-spacing-1))'
              }}
            />
          </button>
        </div>

        {/* Manual Refresh */}
        <button
          onClick={refresh}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-2)',
            padding: 'var(--md-sys-spacing-2) var(--md-sys-spacing-4)',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            fontSize: 'var(--md-sys-typescale-label-large-font-size)',
            fontWeight: 'var(--md-sys-typescale-label-large-font-weight)',
            lineHeight: 'var(--md-sys-typescale-label-large-line-height)',
            transition: 'opacity, transform, background-color, color, border-color, box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
            backgroundColor: isLoading ? 'var(--md-sys-color-surface-container-high)' : 'var(--md-sys-color-primary)',
            color: isLoading ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-primary)',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? (
            <svg
              style={{
                animation: 'spin var(--md-sys-motion-duration-long) var(--md-sys-motion-easing-standard) infinite',
                height: 'var(--md-sys-spacing-4)',
                width: 'var(--md-sys-spacing-4)'
              }}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle style={{opacity: 'var(--md-sys-state-opacity-tint-subtle)'}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{opacity: 'var(--md-sys-state-opacity-supporting)'}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg
              style={{
                height: 'var(--md-sys-spacing-4)',
                width: 'var(--md-sys-spacing-4)'
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {isLoading ? 'Aggiornando...' : 'Aggiorna'}
        </button>

        {/* Last Update */}
        <div
          style={{
            fontSize: 'var(--md-sys-typescale-body-small-font-size)',
            fontWeight: 'var(--md-sys-typescale-body-small-font-weight)',
            lineHeight: 'var(--md-sys-typescale-body-large-line-height)',
            color: 'var(--md-sys-color-on-surface-variant)'
          }}
        >
          {formatLastUpdate(lastUpdate)}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ALERTS SECTION
// ============================================================================

const AlertsSection: React.FC = () => {
  const alerts = useAlerts();

  if (alerts.length === 0) {
    return (
        <div
          style={{
            borderRadius: 'var(--md-sys-radius-3)',
            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            padding: 'var(--md-sys-spacing-6)',
          }}
        >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--md-sys-spacing-3)',
            marginBottom: 'var(--md-sys-spacing-4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'var(--md-sys-spacing-8)',
              height: 'var(--md-sys-spacing-8)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              backgroundColor: 'var(--md-sys-color-tertiary-container)',
            }}
          >
            <svg
              style={{
                width: 'var(--md-sys-spacing-4)',
                height: 'var(--md-sys-spacing-4)',
                color: 'var(--md-sys-color-tertiary)',
              }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3
            style={{
              fontSize: 'var(--md-sys-typescale-title-large-font-size)',
              fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            Tutto OK
          </h3>
        </div>
        <p
          style={{
            fontSize: 'var(--md-sys-typescale-body-large-font-size)',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          Nessun alert attivo nelle ultime 24 ore.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 'var(--md-sys-radius-3)',
        border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
        backgroundColor: 'var(--md-sys-color-surface-container-low)',
        padding: 'var(--md-sys-spacing-6)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--md-sys-spacing-3)',
          marginBottom: 'var(--md-sys-spacing-4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'var(--md-sys-spacing-8)',
            height: 'var(--md-sys-spacing-8)',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            backgroundColor: 'var(--md-sys-color-error-container)',
          }}
        >
          <svg
            style={{
              width: 'var(--md-sys-spacing-4)',
              height: 'var(--md-sys-spacing-4)',
              color: 'var(--md-sys-color-error)',
            }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h3
          style={{
            fontSize: 'var(--md-sys-typescale-title-large-font-size)',
            fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          Alert Attivi ({alerts.length})
        </h3>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--md-sys-spacing-3)',
        }}
      >
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--md-sys-spacing-3)',
              padding: 'var(--md-sys-spacing-3)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-highest)',
            }}
          >
            <div
              style={{
                width: 'var(--md-sys-spacing-2)',
                height: 'var(--md-sys-spacing-2)',
                borderRadius: 'var(--md-sys-shape-corner-full)',
                marginTop: 'var(--md-sys-spacing-2)',
                backgroundColor: alert.type === 'critical' ? 'var(--md-sys-color-error)' :
                               alert.type === 'warning' ? 'var(--md-sys-color-secondary)' :
                               'var(--md-sys-color-tertiary)',
              }}
            />
            <div
              style={{
                flex: '1',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--md-sys-spacing-2)',
                  marginBottom: 'var(--md-sys-spacing-1)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                    fontWeight: 'var(--md-sys-typescale-label-large-font-weight)',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  {alert.title}
                </span>
                <span
                  style={{
                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                    padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-2)',
                    borderRadius: 'var(--md-sys-radius-3)',
                    backgroundColor: alert.type === 'critical' ? 'var(--md-sys-color-error-container)' :
                                   alert.type === 'warning' ? 'var(--md-sys-color-secondary-container)' :
                                   'var(--md-sys-color-tertiary-container)',
                    color: alert.type === 'critical' ? 'var(--md-sys-color-on-error-container)' :
                          alert.type === 'warning' ? 'var(--md-sys-color-on-secondary-container)' :
                          'var(--md-sys-color-on-tertiary-container)',
                  }}
                >
                  {alert.type}
                </span>
              </div>
              <p
                style={{
                  fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {alert.message}
              </p>
              <p
                style={{
                  fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                  marginTop: 'var(--md-sys-spacing-1)',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export const Dashboard: React.FC = () => {
  const { fetchMetrics } = useDashboardStore();
  const current = useCurrentMetrics();
  const baseline = useBaselineMetrics();
  const trendData = useTrendData();
  const aiErrors = useAIErrors();
  const lazyLoading = useLazyLoadingEfficiency();
  const isLoading = useIsLoading();
  const error = useError();

  // Initialize auto-refresh
  useAutoRefresh();

  // Initial data fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Add spin animation keyframes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (error) {
    return (
      <div
        style={{
          minHeight: 'var(--md-sys-viewport-height-full)',
          padding: 'var(--md-sys-spacing-6)',
        }}
      >
        <div
          style={{
            maxWidth: 'calc(var(--md-sys-layout-panel-max-width) * 1.6)', // 1280px using MD3 tokens
            margin: '0 var(--md-sys-margin-auto)',
            borderRadius: 'var(--md-sys-radius-3)',
            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-error)',
            backgroundColor: 'var(--md-sys-color-error-container)',
            padding: 'var(--md-sys-spacing-6)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--md-sys-spacing-3)',
              marginBottom: 'var(--md-sys-spacing-4)',
            }}
          >
            <svg
              style={{
                width: 'var(--md-sys-layout-fab-size)',
                height: 'var(--md-sys-layout-fab-size)',
                color: 'var(--md-sys-color-error)',
              }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h2
              style={{
                fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                color: 'var(--md-sys-color-on-error-container)',
              }}
            >
              Errore nel caricamento del dashboard
            </h2>
          </div>
          <p
            style={{
              fontSize: 'var(--md-sys-typescale-body-large-font-size)',
              marginBottom: 'var(--md-sys-spacing-4)',
              color: 'var(--md-sys-color-on-error-container)',
            }}
          >
            {error}
          </p>
          <button
            onClick={fetchMetrics}
            style={{
              padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-2)',
              backgroundColor: 'var(--md-sys-color-error)',
              color: 'var(--md-sys-color-on-error)',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--md-sys-color-error-hover)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--md-sys-color-error)';
            }}
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !current) {
    return (
      <div
        style={{
          minHeight: 'var(--md-sys-viewport-height-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 'var(--md-sys-layout-fab-size)',
              height: 'var(--md-sys-layout-fab-size)',
              borderRadius: 'var(--md-sys-percent-100)',
              border: 'var(--md-sys-border-width-normal) solid transparent',
              borderTopColor: 'var(--md-sys-color-primary)',
              animation: 'spin var(--md-sys-motion-duration-long) var(--md-sys-motion-easing-standard) infinite',
              margin: '0 var(--md-sys-margin-auto) var(--md-sys-spacing-4)',
            }}
          />
          <p
            style={{
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            Caricamento dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div
        style={{
          minHeight: 'var(--md-sys-viewport-height-full)',
          padding: 'var(--md-sys-spacing-6)',
        }}
      >
        <div
          style={{
            maxWidth: 'calc(var(--md-sys-layout-panel-max-width) * 1.6)', // 1280px using MD3 tokens
            margin: '0 var(--md-sys-margin-auto)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            Nessun dato disponibile. Verifica che il sistema di monitoraggio sia attivo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 'var(--md-sys-viewport-height-full)',
        padding: 'var(--md-sys-spacing-6)',
      }}
    >
      <div
        style={{
          maxWidth: 'calc(var(--md-sys-layout-panel-max-width) * 1.6)', // 1280px using MD3 tokens
          margin: '0 var(--md-sys-margin-auto)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--md-sys-spacing-8)',
        }}
      >
        {/* Header */}
        <DashboardHeader />

        {/* Key Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-grid-min-card), var(--md-sys-grid-fr-1)))',
            gap: 'var(--md-sys-spacing-6)',
          }}
        >
          <FPSCard current={current} baseline={baseline} />
          <MemoryCard current={current} baseline={baseline} />
          <BundleSizeCard current={current} baseline={baseline} />
          <AIMetricsCard current={current} baseline={baseline} />
        </div>

        {/* Charts Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-grid-min-large), var(--md-sys-grid-fr-1)))',
            gap: 'var(--md-sys-spacing-8)',
          }}
        >
          {/* Performance Trend */}
          <div
            style={{
              borderRadius: 'var(--md-sys-radius-3)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              padding: 'var(--md-sys-spacing-6)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                marginBottom: 'var(--md-sys-spacing-4)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              Trend Performance (7 giorni)
            </h3>
            <PerformanceTrendChart data={trendData} />
          </div>

          {/* Memory Usage */}
          <div
            style={{
              borderRadius: 'var(--md-sys-radius-3)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              padding: 'var(--md-sys-spacing-6)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                marginBottom: 'var(--md-sys-spacing-4)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              Utilizzo Memoria
            </h3>
            <MemoryUsageChart data={trendData.slice(-24)} /> {/* Ultime 24 ore */}
          </div>

          {/* AI Errors */}
          <div
            style={{
              borderRadius: 'var(--md-sys-radius-3)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              padding: 'var(--md-sys-spacing-6)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                marginBottom: 'var(--md-sys-spacing-4)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              Errori AI per Categoria
            </h3>
            <AIErrorsChart errorsByCategory={aiErrors} />
          </div>

          {/* Lazy Loading */}
          <div
            style={{
              borderRadius: 'var(--md-sys-radius-3)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              padding: 'var(--md-sys-spacing-6)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                marginBottom: 'var(--md-sys-spacing-4)',
                color: 'var(--md-sys-color-on-surface)',
              }}
            >
              Tempi Lazy Loading
            </h3>
            <LazyLoadingChart loadTimes={current.lazyLoading.loadTimes} />
          </div>
        </div>

        {/* Bundle Size Trend */}
        <div
          style={{
            borderRadius: 'var(--md-sys-radius-3)',
            border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
            backgroundColor: 'var(--md-sys-color-surface-container-low)',
            padding: 'var(--md-sys-spacing-6)',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--md-sys-typescale-title-large-font-size)',
              fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
              marginBottom: 'var(--md-sys-spacing-4)',
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            Trend Bundle Size (7 giorni)
          </h3>
          <BundleSizeTrendChart data={trendData} />
        </div>

        {/* Alerts Section */}
        <AlertsSection />

        {/* Lazy Loading Efficiency Summary */}
        {lazyLoading && (
          <div
            style={{
              borderRadius: 'var(--md-sys-radius-3)',
              border: 'var(--md-sys-border-width-thin) solid var(--md-sys-color-outline-variant)',
              backgroundColor: 'var(--md-sys-color-surface-container-low)',
              padding: 'var(--md-sys-spacing-6)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--md-sys-spacing-4)',
              }}
            >
              <h3
                style={{
                  fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                  fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                Efficienza Lazy Loading
              </h3>
              <div
                style={{
                  fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                  fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                  color: 'var(--md-sys-color-primary)',
                }}
              >
                {lazyLoading.efficiency}%
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(var(--md-sys-layout-grid-min-wide), var(--md-sys-grid-fr-1)))',
                gap: 'var(--md-sys-spacing-4)',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                    fontWeight: 'var(--md-sys-typescale-body-large-font-weight)',
                    marginBottom: 'var(--md-sys-spacing-1)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  Componenti Caricati
                </div>
                <div
                  style={{
                    fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                    fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  {lazyLoading.totalComponents}
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                    fontWeight: 'var(--md-sys-typescale-body-large-font-weight)',
                    marginBottom: 'var(--md-sys-spacing-1)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  Tempo Medio
                </div>
                <div
                  style={{
                    fontSize: 'var(--md-sys-typescale-title-large-font-size)',
                    fontWeight: 'var(--md-sys-typescale-title-large-font-size-weight)',
                    color: 'var(--md-sys-color-on-surface)',
                  }}
                >
                  {lazyLoading.averageLoadTime}ms
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                    fontWeight: 'var(--md-sys-typescale-body-large-font-weight)',
                    marginBottom: 'var(--md-sys-spacing-1)',
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  Stato
                </div>
                <div
                  style={{
                    fontSize: 'var(--md-sys-typescale-body-large-font-size)',
                    fontWeight: 'var(--md-sys-typescale-body-large-font-weight)',
                    padding: 'var(--md-sys-spacing-1) var(--md-sys-spacing-2)',
                    borderRadius: 'var(--md-sys-radius-3)',
                    display: 'inline-block',
                    backgroundColor: lazyLoading.efficiency >= 80 ? 'var(--md-sys-color-tertiary-container)' :
                                   lazyLoading.efficiency >= 60 ? 'var(--md-sys-color-secondary-container)' :
                                   'var(--md-sys-color-error-container)',
                    color: lazyLoading.efficiency >= 80 ? 'var(--md-sys-color-on-tertiary-container)' :
                          lazyLoading.efficiency >= 60 ? 'var(--md-sys-color-on-secondary-container)' :
                          'var(--md-sys-color-on-error-container)',
                  }}
                >
                  {lazyLoading.efficiency >= 80 ? 'Ottimo' :
                   lazyLoading.efficiency >= 60 ? 'Buono' : 'Da migliorare'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
