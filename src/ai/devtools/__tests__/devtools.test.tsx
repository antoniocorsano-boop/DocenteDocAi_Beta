/**
 * devtools.test.tsx — Sprint 2: AI DevTools unit tests
 *
 * Tests:
 *   1. AICacheStats renders correctly and clears cache
 *   2. AISpanTimeline renders empty state and run step bars
 *   3. AIAuditViewer loads runs from in-memory trail
 *   4. AIInspectorPanel is hidden without beta mode
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../../hooks/useAIBeta', () => ({
  useAIBeta: vi.fn(() => ({ isBeta: true, setBeta: vi.fn() })),
}));

vi.mock('../../cache/aiCache', () => ({
  getCacheStats: vi.fn(() => ({ size: 3, hits: 8, misses: 2, hitRate: 0.8 })),
  getUnifiedCacheSize: vi.fn(() => 1),
  clearAllCaches: vi.fn(),
}));

vi.mock('../../audit/auditTrail', () => ({
  getAuditHistory: vi.fn(() => [
    {
      id: 'run-abc-001',
      startedAt: '2026-03-15T10:00:00.000Z',
      finishedAt: '2026-03-15T10:00:00.045Z',
      totalMs: 45,
      contextHash: 'abc123',
      cacheHit: false,
      steps: [
        { name: 'classHealth', durationMs: 10, completedAt: '2026-03-15T10:00:00.010Z' },
        { name: 'riskAnalyzer', durationMs: 20, completedAt: '2026-03-15T10:00:00.030Z', inputSummary: '22 studenti', outputSummary: '3 a rischio' },
        { name: 'excellenceAnalyzer', durationMs: 15, completedAt: '2026-03-15T10:00:00.045Z' },
      ],
    },
  ]),
  clearAuditHistory: vi.fn(),
}));

vi.mock('../../audit/auditDb', () => ({
  getAllPersistedAudits: vi.fn(async () => []),
  clearPersistedAudits: vi.fn(async () => undefined),
  exportAuditJSON: vi.fn(async () => new Blob(['[]'], { type: 'application/json' })),
}));

// ── imports (after mocks) ─────────────────────────────────────────────────────

import AICacheStats from '../AICacheStats';
import AISpanTimeline from '../AISpanTimeline';
import AIAuditViewer from '../AIAuditViewer';
import AIInspectorPanel from '../AIInspectorPanel';
import { useAIBeta } from '../../../hooks/useAIBeta';
import { clearAllCaches } from '../../cache/aiCache';
import { getAuditHistory } from '../../audit/auditTrail';
import type { AIAuditTrail } from '../../audit/auditTypes';

// ── helpers ───────────────────────────────────────────────────────────────────

const mockHistory = getAuditHistory() as AIAuditTrail[];

// ── tests ─────────────────────────────────────────────────────────────────────

describe('AICacheStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rendeirzes hit-rate and entry count', () => {
    render(<AICacheStats />);
    expect(screen.getByText('8')).toBeInTheDocument();  // hits
    expect(screen.getByText('80.0%')).toBeInTheDocument(); // hit-rate
    expect(screen.getByText('3')).toBeInTheDocument();  // size
  });

  it('shows unified cache chip when unified size > 0', () => {
    render(<AICacheStats />);
    expect(screen.getByText('+1 unified')).toBeInTheDocument();
  });

  it('calls clearAllCaches and notifies onClear when button clicked', () => {
    const onClear = vi.fn();
    render(<AICacheStats onClear={onClear} />);
    const btn = screen.getByRole('button', { name: /svuota entrambe le cache ai/i });
    fireEvent.click(btn);
    expect(clearAllCaches).toHaveBeenCalledOnce();
    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe('AISpanTimeline', () => {
  it('renders empty state when no history provided', () => {
    render(<AISpanTimeline history={[]} />);
    expect(screen.getByText(/nessun run completato/i)).toBeInTheDocument();
  });

  it('renders span bars for each step in the run', () => {
    render(<AISpanTimeline history={mockHistory} />);
    expect(screen.getByText('classHealth')).toBeInTheDocument();
    expect(screen.getByText('riskAnalyzer')).toBeInTheDocument();
    expect(screen.getByText('excellenceAnalyzer')).toBeInTheDocument();
  });

  it('renders duration labels', () => {
    render(<AISpanTimeline history={mockHistory} />);
    // each step shows "X ms"
    expect(screen.getByText('10 ms')).toBeInTheDocument();
    expect(screen.getByText('20 ms')).toBeInTheDocument();
  });

  it('shows total duration in legend', () => {
    render(<AISpanTimeline history={mockHistory} />);
    expect(screen.getByText('Totale: 45 ms')).toBeInTheDocument();
  });

  it('hides run selector when only one run', () => {
    render(<AISpanTimeline history={mockHistory} />);
    expect(screen.queryByLabelText(/seleziona run/i)).not.toBeInTheDocument();
  });
});

describe('AIAuditViewer', () => {
  it('renders loading state initially', () => {
    render(<AIAuditViewer />);
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('renders run rows after loading', async () => {
    render(<AIAuditViewer />);
    await waitFor(() => {
      // The in-memory run should be visible
      expect(screen.getByText(/45 ms/)).toBeInTheDocument();
    });
  });

  it('shows audit trail header with count', async () => {
    render(<AIAuditViewer />);
    await waitFor(() => {
      expect(screen.getByText(/Audit Trail/i)).toBeInTheDocument();
    });
  });

  it('export button is present', async () => {
    render(<AIAuditViewer />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /esporta audit/i })).toBeInTheDocument();
    });
  });
});

describe('AIInspectorPanel', () => {
  it('renders locked message when beta mode is off', () => {
    (useAIBeta as ReturnType<typeof vi.fn>).mockReturnValueOnce({ isBeta: false, setBeta: vi.fn() });
    render(<AIInspectorPanel />);
    expect(screen.getByText(/ai inspector è disponibile/i)).toBeInTheDocument();
  });

  it('renders dashboard sections when beta mode is on', async () => {
    render(<AIInspectorPanel />);
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /AI Inspector Panel/i })).toBeInTheDocument();
    });
  });

  it('renders Cache AI section heading', async () => {
    render(<AIInspectorPanel />);
    await waitFor(() => {
      expect(screen.getByText('Cache AI')).toBeInTheDocument();
    });
  });

  it('renders Span Timeline section heading', async () => {
    render(<AIInspectorPanel />);
    await waitFor(() => {
      expect(screen.getByText('Span Timeline')).toBeInTheDocument();
    });
  });

  it('renders Audit Trail section heading', async () => {
    render(<AIInspectorPanel />);
    await waitFor(() => {
      // AIAuditViewer renders 'Audit Trail (N)' — match at least one element
      const headings = screen.queryAllByText(/Audit Trail/i);
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
