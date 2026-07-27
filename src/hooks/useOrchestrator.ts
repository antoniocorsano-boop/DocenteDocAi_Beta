/**
 * hooks/useOrchestrator.ts — React hook wrapping CognitiveOrchestrator
 *
 * Provides loading / result / error state management for components
 * that need to invoke the cognitive orchestration pipeline.
 *
 * Usage:
 *   const { run, loading, result, error, reset } = useOrchestrator();
 *   await run('analizza il profilo di Mario Rossi');
 */

import { useState, useCallback } from 'react';
import { CognitiveOrchestrator } from '@/modules/orchestration/CognitiveOrchestrator';
import type { OrchestratorResult } from '@/modules/orchestration/CognitiveOrchestrator';

// ── Return type ───────────────────────────────────────────────────────────────

export interface UseOrchestratorReturn {
  /** Trigger a full orchestration run for the given input */
  run:     (input: string) => Promise<OrchestratorResult | null>;
  /** True while an orchestration run is in progress */
  loading: boolean;
  /** Most recent successful result, or null if none yet */
  result:  OrchestratorResult | null;
  /** Error message from the most recent failed run, or null */
  error:   string | null;
  /** Clear previous result and error state */
  reset:   () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOrchestrator(): UseOrchestratorReturn {
  const [loading, setLoading] = useState(false);
  const [result,  setResult ] = useState<OrchestratorResult | null>(null);
  const [error,   setError  ] = useState<string | null>(null);

  const run = useCallback(async (input: string): Promise<OrchestratorResult | null> => {
    if (!input.trim()) return null;

    setLoading(true);
    setError(null);

    try {
      const orchestrationResult = await CognitiveOrchestrator.run(input);
      setResult(orchestrationResult);
      return orchestrationResult;
    } catch (err) {
      // CognitiveOrchestrator.run() should never throw, but guard anyway
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { run, loading, result, error, reset };
}
