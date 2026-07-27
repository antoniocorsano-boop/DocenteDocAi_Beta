/**
 * useAIBeta.ts — AI Experimental Mode hook (FASE 5)
 *
 * Controls access to the "AI Experimental" feature gate.
 *
 * Priority (highest to lowest):
 *   1. VITE_AI_BETA=true env var (build-time override, e.g. staging build)
 *   2. localStorage key 'ai_beta_mode' = 'true' (user opt-in via Settings)
 *
 * Usage:
 *   const { isBeta, setBeta } = useAIBeta();
 */
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ai_beta_mode';
const ENV_OVERRIDE = import.meta.env.VITE_AI_BETA === 'true';

export interface UseAIBeta {
  /** true when AI Experimental Mode is active */
  isBeta: boolean;
  /** Toggle or explicitly set the beta mode */
  setBeta: (enabled: boolean) => void;
}

export function useAIBeta(): UseAIBeta {
  const [isBeta, setIsBetaState] = useState<boolean>(() => {
    if (ENV_OVERRIDE) return true;
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const setBeta = useCallback((enabled: boolean) => {
    if (ENV_OVERRIDE) return; // build-time flag cannot be overridden at runtime
    try {
      if (enabled) {
        localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage unavailable — still update in-memory state
    }
    setIsBetaState(enabled);
  }, []);

  return { isBeta, setBeta };
}
