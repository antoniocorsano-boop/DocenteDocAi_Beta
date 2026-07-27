/**
 * __tests__/modules/orchestration/ModeEngine.test.ts — P36.5
 *
 * Pure function tests — no mocking required.
 *
 * Cases:
 *   1–4. getModeConfig returns correct profiles for each mode
 *   5–7. isModeAllowed gates proOnly modes correctly
 *   8.   applyModeConstraints slices to maxSteps
 */

import { describe, it, expect } from 'vitest';
import {
  getModeConfig,
  isModeAllowed,
  applyModeConstraints,
  PRO_ONLY_MODES,
} from '../../../src/modules/orchestration/ModeEngine';

// ── getModeConfig ─────────────────────────────────────────────────────────────

describe('getModeConfig', () => {
  it('fast: maxSteps=1, useMemory=false, retry=false, proOnly=false', () => {
    const cfg = getModeConfig('fast');
    expect(cfg.maxSteps).toBe(1);
    expect(cfg.useMemory).toBe(false);
    expect(cfg.retry).toBe(false);
    expect(cfg.proOnly).toBe(false);
  });

  it('balanced: maxSteps=3, useMemory=true, retry=false, proOnly=false', () => {
    const cfg = getModeConfig('balanced');
    expect(cfg.maxSteps).toBe(3);
    expect(cfg.useMemory).toBe(true);
    expect(cfg.retry).toBe(false);
    expect(cfg.proOnly).toBe(false);
  });

  it('deep: maxSteps=6, useMemory=true, retry=true, proOnly=true', () => {
    const cfg = getModeConfig('deep');
    expect(cfg.maxSteps).toBe(6);
    expect(cfg.useMemory).toBe(true);
    expect(cfg.retry).toBe(true);
    expect(cfg.proOnly).toBe(true);
  });

  it('manual: maxSteps=10, useMemory=true, retry=true, proOnly=true', () => {
    const cfg = getModeConfig('manual');
    expect(cfg.maxSteps).toBe(10);
    expect(cfg.useMemory).toBe(true);
    expect(cfg.retry).toBe(true);
    expect(cfg.proOnly).toBe(true);
  });

  it('all modes have a non-empty label and icon', () => {
    for (const mode of ['fast', 'balanced', 'deep', 'manual'] as const) {
      const cfg = getModeConfig(mode);
      expect(cfg.label.length).toBeGreaterThan(0);
      expect(cfg.icon.length).toBeGreaterThan(0);
    }
  });
});

// ── isModeAllowed ─────────────────────────────────────────────────────────────

describe('isModeAllowed', () => {
  it('allows balanced for free users', () => {
    expect(isModeAllowed('balanced', 'free')).toBe(true);
  });

  it('allows fast for free users', () => {
    expect(isModeAllowed('fast', 'free')).toBe(true);
  });

  it('blocks deep for free users', () => {
    expect(isModeAllowed('deep', 'free')).toBe(false);
  });

  it('blocks manual for free users', () => {
    expect(isModeAllowed('manual', 'free')).toBe(false);
  });

  it('allows deep for pro users', () => {
    expect(isModeAllowed('deep', 'pro')).toBe(true);
  });

  it('allows manual for pro users', () => {
    expect(isModeAllowed('manual', 'pro')).toBe(true);
  });

  it('PRO_ONLY_MODES contains deep and manual', () => {
    expect(PRO_ONLY_MODES).toContain('deep');
    expect(PRO_ONLY_MODES).toContain('manual');
    expect(PRO_ONLY_MODES).not.toContain('fast');
    expect(PRO_ONLY_MODES).not.toContain('balanced');
  });
});

// ── applyModeConstraints ──────────────────────────────────────────────────────

describe('applyModeConstraints', () => {
  const ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('fast: returns only 1 item', () => {
    const result = applyModeConstraints(ITEMS, 'fast');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(1);
  });

  it('balanced: returns first 3 items', () => {
    const result = applyModeConstraints(ITEMS, 'balanced');
    expect(result).toHaveLength(3);
    expect(result).toEqual([1, 2, 3]);
  });

  it('deep: returns first 6 items', () => {
    const result = applyModeConstraints(ITEMS, 'deep');
    expect(result).toHaveLength(6);
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('manual: returns all 10 items', () => {
    const result = applyModeConstraints(ITEMS, 'manual');
    expect(result).toHaveLength(10);
  });

  it('returns empty array if input is empty', () => {
    expect(applyModeConstraints([], 'balanced')).toHaveLength(0);
  });

  it('returns entire array if shorter than maxSteps', () => {
    const short = [1, 2];
    expect(applyModeConstraints(short, 'balanced')).toEqual([1, 2]);
  });
});
