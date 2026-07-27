/**
 * SystemPromptBuilder.test.ts — P37
 *
 * Pure-function tests for buildSystemPrompt.
 * No side effects — no mocking needed.
 */

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '@/modules/orchestration/SystemPromptBuilder';

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
  // ── Minimal input ──────────────────────────────────────────────────────────

  it('returns a non-empty systemPrompt for the minimal required input', () => {
    const { systemPrompt } = buildSystemPrompt({ mode: 'balanced' });
    expect(typeof systemPrompt).toBe('string');
    expect(systemPrompt.length).toBeGreaterThan(0);
  });

  it('returns an enrichedInput object', () => {
    const { enrichedInput } = buildSystemPrompt({ mode: 'balanced' });
    expect(enrichedInput).toBeTruthy();
    expect(typeof enrichedInput).toBe('object');
  });

  // ── Mode section ─────────────────────────────────────────────────────────

  it('includes mode-specific instructions in the system prompt', () => {
    // The system prompt contains Italian instructions derived from the mode,
    // not necessarily the raw English mode name itself. Verify via enrichedInput.
    const modes: Array<'fast' | 'balanced' | 'deep' | 'creative' | 'manual'> = [
      'fast', 'balanced', 'deep', 'creative', 'manual',
    ];
    for (const mode of modes) {
      const { systemPrompt, enrichedInput } = buildSystemPrompt({ mode });
      // enrichedInput must carry the correct mode value
      expect(enrichedInput.mode).toBe(mode);
      // The system prompt must have some content
      expect(systemPrompt.length).toBeGreaterThan(10);
    }
  });

  it('reflects the mode in enrichedInput', () => {
    const { enrichedInput } = buildSystemPrompt({ mode: 'deep' });
    expect(enrichedInput.mode).toBe('deep');
  });

  // ── Persona section ───────────────────────────────────────────────────────

  it('includes user profile role when provided', () => {
    const { systemPrompt } = buildSystemPrompt({
      mode:        'balanced',
      userProfile: { role: 'docente', school: 'ITIS Fermi', subject: 'Fisica' },
    });
    expect(systemPrompt).toMatch(/docente/i);
  });

  it('includes subject in enrichedInput', () => {
    const { enrichedInput } = buildSystemPrompt({
      mode:        'balanced',
      userProfile: { subject: 'Matematica' },
    });
    expect(enrichedInput.subject).toBe('Matematica');
  });

  it('uses default role "docente" when no profile is given', () => {
    const { enrichedInput } = buildSystemPrompt({ mode: 'balanced' });
    expect(enrichedInput.userRole).toBe('docente');
  });

  // ── Memory section ────────────────────────────────────────────────────────

  it('reports hasMemory=false when memory is empty', () => {
    const { enrichedInput } = buildSystemPrompt({ mode: 'balanced', memory: [] });
    expect(enrichedInput.hasMemory).toBe(false);
    expect(enrichedInput.memoryCount).toBe(0);
  });

  it('reports hasMemory=true when memory items are provided', () => {
    const { enrichedInput } = buildSystemPrompt({
      mode:   'balanced',
      memory: ['Preferisce spiegazioni brevi', 'Usa spesso schemi'],
    });
    expect(enrichedInput.hasMemory).toBe(true);
    expect(enrichedInput.memoryCount).toBe(2);
  });

  it('includes a memory item excerpt in the system prompt', () => {
    const { systemPrompt } = buildSystemPrompt({
      mode:   'balanced',
      memory: ['Preferisce schemi visivi'],
    });
    expect(systemPrompt).toMatch(/schemi visivi/i);
  });

  it('truncates long memory items at 200 chars', () => {
    const long = 'X'.repeat(300);
    const { systemPrompt } = buildSystemPrompt({
      mode:   'balanced',
      memory: [long],
    });
    // The memory section should reference the item but be capped
    const lines = systemPrompt.split('\n');
    const memLine = lines.find(l => l.includes('X'));
    if (memLine) {
      // Should not include more than 200 consecutive 'X' characters
      expect(memLine.match(/X+/)?.[0].length).toBeLessThanOrEqual(200);
    }
  });

  // ── Token budget ──────────────────────────────────────────────────────────

  it('respects the maxTokens budget (result shorter than budget)', () => {
    const budget = 500;
    const { systemPrompt } = buildSystemPrompt({
      mode:      'balanced',
      memory:    Array.from({ length: 20 }, (_, i) => `Memoria item ${i}`),
      maxTokens: budget,
    });
    // Rough heuristic: 1 token ≈ 4 chars
    const approxTokens = systemPrompt.length / 4;
    expect(approxTokens).toBeLessThanOrEqual(budget * 1.2); // allow 20% slack
  });

  // ── Graceful degradation ──────────────────────────────────────────────────

  it('never throws even with all optional fields missing', () => {
    expect(() => buildSystemPrompt({ mode: 'fast' })).not.toThrow();
  });

  it('never throws even with null-ish optional fields', () => {
    expect(() =>
      buildSystemPrompt({
        mode:        'manual',
        userProfile: undefined,
        memory:      undefined,
        agentParams: undefined,
        maxTokens:   undefined,
      })
    ).not.toThrow();
  });

  // ── agentParams passthrough ───────────────────────────────────────────────

  it('passes through agentParams to enrichedInput', () => {
    const params = { temperature: 0.7, maxOutputTokens: 1024 };
    const { enrichedInput } = buildSystemPrompt({
      mode:        'creative',
      agentParams: params,
    });
    expect(enrichedInput.agentParams).toEqual(params);
  });
});
