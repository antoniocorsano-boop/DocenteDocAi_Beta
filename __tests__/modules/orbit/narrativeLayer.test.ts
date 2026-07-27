/**
 * __tests__/modules/orbit/narrativeLayer.test.ts
 *
 * Unit tests for P21 — Narrative Layer.
 *
 * Coverage targets:
 *   - generateNarrative: null for empty list
 *   - generateNarrative: null for idle-only list
 *   - generateNarrative: correct Italian label for each action type
 *   - generateNarrative: picks highest-priority non-idle action
 *   - generateRichNarrative: null for empty list
 *   - generateRichNarrative: "Personality: label" format
 *   - generateRichNarrative: falls back to "Agent" when id not found
 *   - generateRichNarrative: picks highest-priority non-idle action
 *   - generateRichNarrative: skips idle even when it has highest priority
 *   - NARRATIVE_LABELS_IT: all action types covered, non-empty except idle
 *   - PERSONALITY_LABEL_IT: all personalities covered
 */

import { describe, it, expect } from 'vitest';

import {
  generateNarrative,
  generateRichNarrative,
  NARRATIVE_LABELS_IT,
  PERSONALITY_LABEL_IT,
} from '../../../src/modules/orbit/narrativeLayer';
import type {
  NarrativeAgent,
} from '../../../src/modules/orbit/narrativeLayer';
import type { AgentAction }     from '../../../src/modules/orbit/coordinationEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function act(
  type:     AgentAction['type'],
  agentId:  string,
  priority: number,
): AgentAction {
  return { type, agentId, priority };
}

function agent(id: string, personality: NarrativeAgent['personality']): NarrativeAgent {
  return { id, personality };
}

// ─── generateNarrative ───────────────────────────────────────────────────────

describe('generateNarrative', () => {
  it('returns null for an empty array', () => {
    expect(generateNarrative([])).toBeNull();
  });

  it('returns null when all actions are idle', () => {
    expect(generateNarrative([act('idle', 'a', 10), act('idle', 'b', 5)])).toBeNull();
  });

  it('returns an Italian label for execute', () => {
    expect(generateNarrative([act('execute', 'a', 10)])).toBe('Esecuzione operazione…');
  });

  it('returns an Italian label for analyze', () => {
    expect(generateNarrative([act('analyze', 'a', 8)])).toBe('Analisi in corso…');
  });

  it('returns an Italian label for explain', () => {
    expect(generateNarrative([act('explain', 'a', 8)])).toBe('Ti spiego cosa sta succedendo…');
  });

  it('picks the highest-priority non-idle action', () => {
    const label = generateNarrative([
      act('observe',  'a', 1),
      act('execute',  'b', 10),
      act('analyze',  'c', 7),
    ]);
    expect(label).toBe('Esecuzione operazione…');
  });

  it('skips idle even when idle has the highest priority', () => {
    const label = generateNarrative([
      act('idle',    'a', 99),
      act('analyze', 'b', 5),
    ]);
    expect(label).toBe('Analisi in corso…');
  });
});

// ─── generateRichNarrative ───────────────────────────────────────────────────

describe('generateRichNarrative', () => {
  it('returns null for an empty action list', () => {
    expect(generateRichNarrative([], [])).toBeNull();
  });

  it('returns null for idle-only actions', () => {
    expect(generateRichNarrative([act('idle', 'a', 5)], [agent('a', 'analyst')])).toBeNull();
  });

  it('returns "Personality: label" format', () => {
    const result = generateRichNarrative(
      [act('analyze', 'analyst-1', 10)],
      [agent('analyst-1', 'analyst')],
    );
    expect(result).toBe('Analyst: Analisi in corso…');
  });

  it('uses executor personality label for execute action', () => {
    const result = generateRichNarrative(
      [act('execute', 'exec-1', 10)],
      [agent('exec-1', 'executor')],
    );
    expect(result).toBe('Executor: Esecuzione operazione…');
  });

  it('uses mentor label for explain action', () => {
    const result = generateRichNarrative(
      [act('explain', 'mentor-1', 10)],
      [agent('mentor-1', 'mentor')],
    );
    expect(result).toBe('Mentor: Ti spiego cosa sta succedendo…');
  });

  it('falls back to "Agent" when agentId is not in roster', () => {
    const result = generateRichNarrative(
      [act('analyze', 'unknown-id', 10)],
      [agent('other-id', 'analyst')],
    );
    expect(result).toBe('Agent: Analisi in corso…');
  });

  it('falls back to "Agent" when agents list is empty', () => {
    const result = generateRichNarrative(
      [act('plan', 'a1', 8)],
      [],
    );
    expect(result).toBe('Agent: Sto pianificando i passi…');
  });

  it('picks the highest-priority non-idle action among multiple', () => {
    const result = generateRichNarrative(
      [
        act('observe',  'obs-1',  1),
        act('execute',  'exec-1', 10),
        act('analyze',  'ana-1',  7),
      ],
      [
        agent('obs-1',  'observer'),
        agent('exec-1', 'executor'),
        agent('ana-1',  'analyst'),
      ],
    );
    expect(result).toBe('Executor: Esecuzione operazione…');
  });

  it('skips idle even when idle carries highest priority', () => {
    const result = generateRichNarrative(
      [
        act('idle',    'a', 99),
        act('handoff', 'b', 9),
      ],
      [
        agent('a', 'observer'),
        agent('b', 'analyst'),
      ],
    );
    expect(result).toBe('Analyst: Passaggio tra agenti…');
  });
});

// ─── NARRATIVE_LABELS_IT completeness ────────────────────────────────────────

describe('NARRATIVE_LABELS_IT', () => {
  const allTypes = [
    'analyze', 'plan', 'execute', 'explain', 'observe', 'handoff', 'idle',
  ] as const;

  it.each(allTypes)('has an entry for "%s"', (type) => {
    expect(NARRATIVE_LABELS_IT).toHaveProperty(type);
  });

  it('all non-idle labels are non-empty strings', () => {
    for (const [type, label] of Object.entries(NARRATIVE_LABELS_IT)) {
      if (type !== 'idle') {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      }
    }
  });

  it('idle label is an empty string', () => {
    expect(NARRATIVE_LABELS_IT.idle).toBe('');
  });
});

// ─── PERSONALITY_LABEL_IT completeness ───────────────────────────────────────

describe('PERSONALITY_LABEL_IT', () => {
  const allPersonalities = ['analyst', 'executor', 'mentor', 'observer'] as const;

  it.each(allPersonalities)('has a display name for "%s"', (p) => {
    expect(typeof PERSONALITY_LABEL_IT[p]).toBe('string');
    expect(PERSONALITY_LABEL_IT[p].length).toBeGreaterThan(0);
  });
});
