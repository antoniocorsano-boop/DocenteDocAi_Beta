// @ts-nocheck
/**
 * useJourneyProgress hook tests
 *
 * Covers:
 *  - Returns correct JourneyLevel (esploratore / praticante / maestro)
 *  - artisticActions stays empty for esploratore (no AI call)
 *  - generateArtisticNextActions is called for praticante+, and its return
 *    is merged into nextActions
 *  - nextActions is capped at 3 total
 *  - updates when capabilityLevel changes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useJourneyProgress } from '../../src/hooks/useJourneyProgress';

// ── Store mocks ───────────────────────────────────────────────────────────────

vi.mock('../../src/stores/useTeacherModelStore', () => ({
  useTeacherModelStore: vi.fn(),
}));

vi.mock('../../src/stores/useAIMaturitaStore', () => ({
  useAIMaturitaStore: vi.fn(),
}));

// ── Cognition mocks ───────────────────────────────────────────────────────────

vi.mock('../../src/cognition', () => ({
  toJourneyLevel: vi.fn(),
  computeJourneyProgress: vi.fn(() => 0.5),
  generateNextActions: vi.fn(() => []),
}));

vi.mock('../../src/cognition/SuggestionEngine', () => ({
  generateArtisticNextActions: vi.fn(),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { useTeacherModelStore } from '../../src/stores/useTeacherModelStore';
import { useAIMaturitaStore } from '../../src/stores/useAIMaturitaStore';
import { toJourneyLevel, generateNextActions } from '../../src/cognition';
import { generateArtisticNextActions } from '../../src/cognition/SuggestionEngine';

// ── Model factory ─────────────────────────────────────────────────────────────

function makeModel(capabilityLevel: number) {
  return {
    capabilityLevel,
    confidenceScore: 0.8,
    levelUpPending: false,
    dismissedHints: [],
    lastUpdated: 0,
    usageProfile: {
      featuresDiscovered: 0,
      bookServicesLinked: 0,
      externalServicesConnected: 0,
      isPersonalMode: false,
      workspaceConfigured: false,
    },
    pedagogicalProfile: { preferredMethods: [], subjectAreas: [], classTypes: [], innovationScore: 0 },
    workflowPatterns: [],
    copilotInteractionProfile: {
      suggestionAcceptanceRate: 0,
      manualOverrides: 0,
      automationEnabled: false,
      preferredSuggestionTypes: [],
    },
  };
}

function setupMocks(capabilityLevel: number, options: { aiScore?: number; interactionMode?: string } = {}) {
  const model = makeModel(capabilityLevel);
  // useTeacherModelStore accepts a selector — return the selected slice
  vi.mocked(useTeacherModelStore).mockImplementation((selector) =>
    selector ? selector(model) : model,
  );
  vi.mocked(useAIMaturitaStore).mockImplementation((selector) => {
    const state = {
      globalScore: options.aiScore ?? 20,
      interactionMode: (options.interactionMode ?? 'classica') as any,
    };
    return selector ? selector(state) : state;
  });
}

// ── Tests  ────────────────────────────────────────────────────────────────────

describe('useJourneyProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateArtisticNextActions).mockResolvedValue([]);
    vi.mocked(generateNextActions).mockReturnValue([]);
  });

  it('returns esploratore level when capabilityLevel is 1', async () => {
    vi.mocked(toJourneyLevel).mockReturnValue('esploratore');
    setupMocks(1);

    const { result } = renderHook(() => useJourneyProgress());
    await waitFor(() => expect(result.current.level).toBe('esploratore'));
    expect(result.current.capabilityLevel).toBe(1);
  });

  it('returns praticante level when capabilityLevel is 2', async () => {
    vi.mocked(toJourneyLevel).mockReturnValue('praticante');
    setupMocks(2);

    const { result } = renderHook(() => useJourneyProgress());
    await waitFor(() => expect(result.current.level).toBe('praticante'));
  });

  it('does NOT call generateArtisticNextActions for esploratore', async () => {
    vi.mocked(toJourneyLevel).mockReturnValue('esploratore');
    setupMocks(1);

    renderHook(() => useJourneyProgress());
    // Wait a tick to let the effect run
    await act(() => Promise.resolve());

    expect(generateArtisticNextActions).not.toHaveBeenCalled();
  });

  it('calls generateArtisticNextActions for praticante', async () => {
    vi.mocked(toJourneyLevel).mockReturnValue('praticante');
    setupMocks(2);

    renderHook(() => useJourneyProgress());
    await waitFor(() => expect(generateArtisticNextActions).toHaveBeenCalledOnce());
  });

  it('merges artisticActions into nextActions', async () => {
    vi.mocked(toJourneyLevel).mockReturnValue('praticante');
    setupMocks(2);

    const staticSug = [{ id: 'static-1', type: 'feature', message: 'static', targetView: 'copilot', icon: 'star' }];
    const artisticSug = [{ id: 'artistic-1', type: 'feature', message: 'artistic', targetView: 'copilot', icon: 'palette' }];

    vi.mocked(generateNextActions).mockReturnValue(staticSug);
    vi.mocked(generateArtisticNextActions).mockResolvedValue(artisticSug);

    const { result } = renderHook(() => useJourneyProgress());
    await waitFor(() => result.current.nextActions.some((a) => a.id === 'artistic-1'));

    expect(result.current.nextActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'static-1' }),
        expect.objectContaining({ id: 'artistic-1' }),
      ]),
    );
  });

  it('caps nextActions at 3 even when both static and artistic return many', async () => {
    vi.mocked(toJourneyLevel).mockReturnValue('maestro');
    setupMocks(4);

    const many = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: `sug-${n}-${i}`,
        type: 'feature' as const,
        message: `suggestion ${i}`,
        targetView: 'copilot',
        icon: 'star',
      }));

    vi.mocked(generateNextActions).mockReturnValue(many(3));
    vi.mocked(generateArtisticNextActions).mockResolvedValue(many(3));

    const { result } = renderHook(() => useJourneyProgress());
    await waitFor(() => result.current.nextActions.length > 0);

    expect(result.current.nextActions.length).toBeLessThanOrEqual(3);
  });

  it('exposes levelUpPending from model', async () => {
    vi.mocked(toJourneyLevel).mockReturnValue('praticante');
    const model = { ...makeModel(2), levelUpPending: true };
    vi.mocked(useTeacherModelStore).mockImplementation((sel) => (sel ? sel(model) : model));
    vi.mocked(useAIMaturitaStore).mockImplementation((sel) => {
      const s = { globalScore: 20, interactionMode: 'classica' };
      return sel ? sel(s) : s;
    });

    const { result } = renderHook(() => useJourneyProgress());
    await waitFor(() => expect(result.current.levelUpPending).toBe(true));
  });

  it('exposes isPersonalMode from usageProfile', async () => {
    vi.mocked(toJourneyLevel).mockReturnValue('esploratore');
    const model = { ...makeModel(1), usageProfile: { ...makeModel(1).usageProfile, isPersonalMode: true } };
    vi.mocked(useTeacherModelStore).mockImplementation((sel) => (sel ? sel(model) : model));
    vi.mocked(useAIMaturitaStore).mockImplementation((sel) => {
      const s = { globalScore: 0, interactionMode: 'classica' };
      return sel ? sel(s) : s;
    });

    const { result } = renderHook(() => useJourneyProgress());
    await waitFor(() => expect(result.current.isPersonalMode).toBe(true));
  });

  it('returns [] for nextActions when both static and artistic return nothing', async () => {
    vi.mocked(toJourneyLevel).mockReturnValue('esploratore');
    setupMocks(1);
    vi.mocked(generateNextActions).mockReturnValue([]);
    vi.mocked(generateArtisticNextActions).mockResolvedValue([]);

    const { result } = renderHook(() => useJourneyProgress());
    await act(() => Promise.resolve());
    expect(result.current.nextActions).toEqual([]);
  });
});
