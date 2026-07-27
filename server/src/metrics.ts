/**
 * server/src/metrics.ts — P27 Monitoring & Observability
 *
 * Prometheus-compatible metrics for the DocenteDoc backend.
 *
 * Exposed via GET /metrics (Prometheus text format).
 * Compatible with: Prometheus scraping, Grafana dashboards.
 *
 * Metrics:
 *   http_requests_total        — counter, labels: method/route/status
 *   http_request_duration_ms   — histogram, labels: method/route
 *   http_errors_total          — counter, labels: route/status
 *   + Node.js default metrics  (process CPU, memory, event loop lag, etc.)
 */

import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

// ─── Registry ─────────────────────────────────────────────────────────────────

export const registry = new Registry();

registry.setDefaultLabels({ app: 'docentedoc-backend' });

// Collect Node.js built-in metrics (CPU, memory, GC, event loop lag)
collectDefaultMetrics({ register: registry });

// ─── HTTP metrics ─────────────────────────────────────────────────────────────

/**
 * Total number of HTTP requests received, partitioned by method + route + status code.
 */
export const httpRequests = new Counter({
  name:       'http_requests_total',
  help:       'Total HTTP requests received',
  labelNames: ['method', 'route', 'status'],
  registers:  [registry],
});

/**
 * HTTP request duration histogram in milliseconds, partitioned by method + route.
 * Buckets are chosen to match typical API response-time SLOs.
 */
export const httpDuration = new Histogram({
  name:       'http_request_duration_ms',
  help:       'HTTP request duration in milliseconds',
  labelNames: ['method', 'route'],
  buckets:    [5, 10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000],
  registers:  [registry],
});

/**
 * Total HTTP errors (status >= 400), partitioned by route + status.
 */
export const httpErrors = new Counter({
  name:       'http_errors_total',
  help:       'Total HTTP error responses (status >= 400)',
  labelNames: ['route', 'status'],
  registers:  [registry],
});

/**
 * Client-reported API metrics forwarded via POST /logs.
 * Tracks call counts and error counts per client-side endpoint slug.
 */
export const clientApiCalls = new Counter({
  name:       'client_api_calls_total',
  help:       'Client-side API calls reported via /logs',
  labelNames: ['endpoint'],
  registers:  [registry],
});

export const clientApiErrors = new Counter({
  name:       'client_api_errors_total',
  help:       'Client-side API errors reported via /logs',
  labelNames: ['endpoint'],
  registers:  [registry],
});
