/**
 * AIDevToolsPanel.test.tsx — Rendering tests for AIDevToolsPanel
 *
 * Cache unit tests (hit/miss counting, buildContextHash) live in
 * src/ai/cache/__tests__/aiCache.test.ts to avoid vi.mock hoisting conflicts.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';

// All AI subsystem mocks must be declared before any imports that use them.
// vi.mock is hoisted to the top of the file by Vitest automatically.

vi.mock('../../../ai/cache/aiCache', () => ({
  getCacheStats: vi.fn(() => ({ size: 3, hits: 10, misses: 2, hitRate: 0.833 })),
  getUnifiedCacheSize: vi.fn(() => 0),
  clearCache: vi.fn(),
  clearAllCaches: vi.fn(),
}));

vi.mock('../../../ai/telemetry/aiTelemetry', () => ({
  getTelemetryBuffer: vi.fn(() => []),
  clearTelemetryBuffer: vi.fn(),
}));

vi.mock('../../../ai/engine/aiEngine', () => ({
  getLastRunStats: vi.fn(() => null),
}));

vi.mock('../../../ai/audit/auditTrail', () => ({
  getAuditHistory: vi.fn(() => []),
  clearAuditHistory: vi.fn(),
}));

vi.mock('../../../ai/audit/auditDb', () => ({
  getAllPersistedAudits: vi.fn(async () => []),
  clearPersistedAudits: vi.fn(async () => undefined),
  exportAuditJSON: vi.fn(async () => new Blob(['[]'], { type: 'application/json' })),
}));

// Mock the Sprint 2 inspector so it doesn't duplicate stat labels in this test
vi.mock('../../../ai/devtools/AIInspectorPanel', () => ({
  default: () => React.createElement('div', { 'data-testid': 'ai-inspector-panel' }),
}));

// isBeta is toggled per-test via the module factory variable trick:
// we expose a mutable ref and re-render with different values.
const betaRef = { value: false };
vi.mock('../../../hooks/useAIBeta', () => ({
  useAIBeta: () => ({ isBeta: betaRef.value, setBeta: vi.fn() }),
}));

import AIDevToolsPanel from '../AIDevToolsPanel';
import { getLastRunStats } from '../../../ai/engine/aiEngine';

describe('AIDevToolsPanel — non-beta mode', () => {
  beforeEach(() => {
    betaRef.value = false;
    vi.clearAllMocks();
  });

  it('renders an alert when beta mode is off', () => {
    render(<AIDevToolsPanel />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('alert mentions AI Sperimentale or Dev Tools', () => {
    render(<AIDevToolsPanel />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/sperimentale|dev tools|attiv/i);
  });

  it('does NOT render cache Hit-rate when beta is off', () => {
    render(<AIDevToolsPanel />);
    // The hit-rate stat box label is rendered only in beta mode
    expect(screen.queryByText('Hit-rate')).toBeNull();
  });
});

describe('AIDevToolsPanel — beta mode', () => {
  beforeEach(() => {
    betaRef.value = true;
    vi.clearAllMocks();
  });

  it('renders the cache section', () => {
    render(<AIDevToolsPanel />);
    // The "Cache" section header should be present
    expect(screen.getByText('Cache')).toBeInTheDocument();
  });

  it('renders the cache hit-rate stat box', () => {
    render(<AIDevToolsPanel />);
    expect(screen.getByText('Hit-rate')).toBeInTheDocument();
  });

  it('renders a placeholder when last run stats are null', () => {
    (getLastRunStats as ReturnType<typeof vi.fn>).mockReturnValue(null);
    render(<AIDevToolsPanel />);
    expect(screen.getByText(/nessun run completato/i)).toBeInTheDocument();
  });
});
