// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { useAISnapshotStore } from '../../src/stores/useAISnapshotStore';
import type { AIPipelineResult } from '../../src/ai/pipeline/aiPipeline';

// ============================================================================
// HELPERS
// ============================================================================

function makePipeline(score: number, grade: 'ottimo' | 'buono' | 'sufficiente' | 'critico' = 'buono', riskCount = 1, excellenceCount = 2): AIPipelineResult {
  return {
    classHealth: {
      score,
      grade,
      dimensions: {
        gradeAverage:        { score, label: '', detail: '' },
        riskRatio:           { score: 50, label: '', detail: '' },
        assessmentCoverage:  { score: 50, label: '', detail: '' },
      },
      summary: '',
    },
    riskSuggestions:       Array.from({ length: riskCount }, (_, i) => ({ id: `r${i}`, type: 'warning', message: 'risk', studentId: `s${i}` })) as any,
    excellenceSuggestions: Array.from({ length: excellenceCount }, (_, i) => ({ id: `e${i}`, type: 'info', message: 'excel', studentId: `x${i}` })) as any,
    suggestions:           [],
    riskPredictions:       [],
    lessonAssistant:       { summary: '', suggestions: [], subjectGaps: [] },
  };
}

function resetStore() {
  useAISnapshotStore.setState({ snapshots: [] });
}

// ============================================================================
// TESTS
// ============================================================================

describe('useAISnapshotStore', () => {
  beforeEach(resetStore);

  it('inizia vuoto', () => {
    expect(useAISnapshotStore.getState().snapshots).toHaveLength(0);
  });

  it('saveSnapshot aggiunge uno snapshot', () => {
    const { saveSnapshot } = useAISnapshotStore.getState().actions;
    saveSnapshot('3A', makePipeline(82, 'buono', 1, 3));
    const { snapshots } = useAISnapshotStore.getState();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].className).toBe('3A');
    expect(snapshots[0].score).toBe(82);
    expect(snapshots[0].grade).toBe('buono');
    expect(snapshots[0].riskCount).toBe(1);
    expect(snapshots[0].excellenceCount).toBe(3);
  });

  it('saveSnapshot fa upsert: stesso id non duplica', () => {
    const { saveSnapshot } = useAISnapshotStore.getState().actions;
    saveSnapshot('3A', makePipeline(70, 'buono'));
    saveSnapshot('3A', makePipeline(75, 'buono')); // same day → upsert
    const { snapshots } = useAISnapshotStore.getState();
    // Only one snapshot for 3A today
    const forA = snapshots.filter(s => s.className === '3A');
    expect(forA).toHaveLength(1);
    expect(forA[0].score).toBe(75); // latest value wins
  });

  it('getSnapshots restituisce solo la classe richiesta ordinata per data', () => {
    const { saveSnapshot, getSnapshots } = useAISnapshotStore.getState().actions;
    saveSnapshot('3A', makePipeline(70));
    saveSnapshot('2B', makePipeline(60));
    const forA = getSnapshots('3A');
    const forB = getSnapshots('2B');
    expect(forA).toHaveLength(1);
    expect(forA[0].className).toBe('3A');
    expect(forB).toHaveLength(1);
    expect(forB[0].className).toBe('2B');
  });

  it('clearClass rimuove solo la classe indicata', () => {
    const { saveSnapshot, clearClass } = useAISnapshotStore.getState().actions;
    saveSnapshot('3A', makePipeline(70));
    saveSnapshot('2B', makePipeline(60));
    clearClass('3A');
    const { snapshots } = useAISnapshotStore.getState();
    expect(snapshots.every(s => s.className !== '3A')).toBe(true);
    expect(snapshots.some(s => s.className === '2B')).toBe(true);
  });

  it('pota a massimo 30 snapshot per classe', () => {
    const { saveSnapshot } = useAISnapshotStore.getState().actions;
    const today = new Date().toISOString().slice(0, 10);

    // Inject 35 historical snapshots directly (different fake dates)
    const fakeSnapshots = Array.from({ length: 35 }, (_, i) => {
      const d = new Date(2025, 0, i + 1).toISOString().slice(0, 10);
      return {
        id: `3A::${d}`,
        className: '3A',
        date: d,
        score: 50 + i,
        grade: 'buono' as const,
        riskCount: 0,
        excellenceCount: 0,
      };
    });
    useAISnapshotStore.setState({ snapshots: fakeSnapshots });

    // Now save one more (today — different from fake dates)
    saveSnapshot('3A', makePipeline(99, 'ottimo'));

    const forA = useAISnapshotStore.getState().snapshots.filter(s => s.className === '3A');
    expect(forA.length).toBeLessThanOrEqual(30);
    // Latest snapshot should survive
    expect(forA.some(s => s.date === today)).toBe(true);
  });

  it('snapshot id è nel formato className::date', () => {
    const { saveSnapshot } = useAISnapshotStore.getState().actions;
    saveSnapshot('1C', makePipeline(65));
    const snap = useAISnapshotStore.getState().snapshots[0];
    const today = new Date().toISOString().slice(0, 10);
    expect(snap.id).toBe(`1C::${today}`);
  });

  it('score è arrotondato all\'intero', () => {
    const { saveSnapshot } = useAISnapshotStore.getState().actions;
    saveSnapshot('3A', makePipeline(73.7));
    const snap = useAISnapshotStore.getState().snapshots[0];
    expect(snap.score).toBe(74);
  });
});
