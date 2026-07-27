// @ts-nocheck
/**
 * ArtisticConsilium unit tests
 *
 * Covers:
 *  - getQuickArtisticHint: correct shape, XSS sanitization, actionKey
 *  - generateArtisticSuggestions: parses valid AI output, ignores invalid JSON,
 *    emits artistic.suggestions.generated on success, skips emit on empty result
 *  - initArtisticConsilium: idempotency, uda.created / planning.wizard.completed /
 *    kb.document.uploaded / feature.discovered / workspace.configured handlers
 *  - _resetArtisticConsilium: allows re-initialization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cognitionBus } from '../../src/cognition/CognitionBus';
import {
  getQuickArtisticHint,
  generateArtisticSuggestions,
  initArtisticConsilium,
  _resetArtisticConsilium,
} from '../../src/services/ArtisticConsilium';

// ── Mock streamAIToString ────────────────────────────────────────────────────

vi.mock('../../src/ai/orchestrator/StreamingManager', () => ({
  streamAIToString: vi.fn(),
}));

import { streamAIToString } from '../../src/ai/orchestrator/StreamingManager';

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_AI_RESPONSE = JSON.stringify([
  {
    title: 'Mosaico storico',
    description: 'Gli studenti creano un mosaico visivo su un periodo storico.',
    activityType: 'visual',
    estimatedMinutes: 60,
    materials: ['cartone', 'tempere', 'carta colorata'],
  },
  {
    title: 'Ballata medievale',
    description: 'Composizione musicale ispirata al Medioevo.',
    activityType: 'musical',
    estimatedMinutes: 45,
    materials: ['flauto', 'spartito'],
  },
]);

// ── Test suites ───────────────────────────────────────────────────────────────

describe('ArtisticConsilium', () => {
  beforeEach(() => {
    _resetArtisticConsilium();
    vi.clearAllMocks();
  });

  afterEach(() => {
    _resetArtisticConsilium();
  });

  // ── getQuickArtisticHint ──────────────────────────────────────────────

  describe('getQuickArtisticHint', () => {
    it('returns a CopilotPredictions-format hint', () => {
      const hint = getQuickArtisticHint('Il Romanticismo');
      expect(hint).toMatchObject({
        label: 'Attività artistiche creative',
        actionKey: 'artistic.open',
        actionPayload: {},
        priority: 2,
      });
      expect(hint.id).toMatch(/^artistic\.quick\./);
      expect(hint.description).toContain('Romanticismo');
    });

    it('returns generic topic when udaTitle is omitted', () => {
      const hint = getQuickArtisticHint();
      expect(hint.description).toContain('questa UDA');
    });

    it('sanitizes XSS in udaTitle', () => {
      const hint = getQuickArtisticHint('<script>alert(1)</script>');
      expect(hint.description).not.toContain('<script>');
      expect(hint.description).toContain('&lt;script&gt;');
    });
  });

  // ── generateArtisticSuggestions ───────────────────────────────────────

  describe('generateArtisticSuggestions', () => {
    it('parses valid AI JSON response into ArtisticSuggestion[]', async () => {
      vi.mocked(streamAIToString).mockResolvedValue(VALID_AI_RESPONSE);

      const results = await generateArtisticSuggestions({ subject: 'Storia' });

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        title: 'Mosaico storico',
        activityType: 'visual',
        estimatedMinutes: 60,
        materials: ['cartone', 'tempere', 'carta colorata'],
      });
      expect(results[0].copilotSuggestion).toMatchObject({
        actionKey: 'artistic.open',
        priority: 2,
      });
      expect(results[1].activityType).toBe('musical');
    });

    it('returns [] when AI returns empty string', async () => {
      vi.mocked(streamAIToString).mockResolvedValue('');
      const results = await generateArtisticSuggestions({});
      expect(results).toEqual([]);
    });

    it('returns [] when AI returns malformed JSON', async () => {
      vi.mocked(streamAIToString).mockResolvedValue('not json at all');
      const results = await generateArtisticSuggestions({});
      expect(results).toEqual([]);
    });

    it('returns [] when streamAIToString rejects', async () => {
      vi.mocked(streamAIToString).mockRejectedValue(new Error('Network error'));
      const results = await generateArtisticSuggestions({});
      expect(results).toEqual([]);
    });

    it('caps results at 3 even if AI returns more items', async () => {
      const overlong = JSON.stringify(
        Array.from({ length: 10 }, (_, i) => ({
          title: `Attività ${i}`,
          description: 'desc',
          activityType: 'visual',
          estimatedMinutes: 30,
          materials: [],
        })),
      );
      vi.mocked(streamAIToString).mockResolvedValue(overlong);
      const results = await generateArtisticSuggestions({});
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('tolerates markdown fences around JSON', async () => {
      const fenced = '```json\n' + VALID_AI_RESPONSE + '\n```';
      vi.mocked(streamAIToString).mockResolvedValue(fenced);
      const results = await generateArtisticSuggestions({});
      expect(results).toHaveLength(2);
    });

    it('defaults activityType to interdisciplinary for unknown value', async () => {
      const withBadType = JSON.stringify([
        { title: 'Test', description: 'desc', activityType: 'dance', estimatedMinutes: 30, materials: [] },
      ]);
      vi.mocked(streamAIToString).mockResolvedValue(withBadType);
      const results = await generateArtisticSuggestions({});
      expect(results[0].activityType).toBe('interdisciplinary');
    });

    it('sanitizes XSS in AI output fields', async () => {
      const malicious = JSON.stringify([
        {
          title: '<script>alert(1)</script>',
          description: '<img onerror="xss">',
          activityType: 'visual',
          estimatedMinutes: 30,
          materials: ['<b>bold</b>'],
        },
      ]);
      vi.mocked(streamAIToString).mockResolvedValue(malicious);
      const results = await generateArtisticSuggestions({});
      expect(results[0].title).not.toContain('<script>');
      expect(results[0].description).not.toContain('<img');
      expect(results[0].materials[0]).not.toContain('<b>');
    });

    it('emits artistic.suggestions.generated on success', async () => {
      vi.mocked(streamAIToString).mockResolvedValue(VALID_AI_RESPONSE);
      const emitSpy = vi.spyOn(cognitionBus, 'emit');

      await generateArtisticSuggestions({ subject: 'Arte', gradeLevel: 'biennio' });

      expect(emitSpy).toHaveBeenCalledWith('artistic.suggestions.generated', {
        count: 2,
        subject: 'Arte',
        gradeLevel: 'biennio',
      });
    });

    it('does NOT emit artistic.suggestions.generated when result is empty', async () => {
      vi.mocked(streamAIToString).mockResolvedValue('');
      const emitSpy = vi.spyOn(cognitionBus, 'emit');

      await generateArtisticSuggestions({});

      expect(emitSpy).not.toHaveBeenCalledWith(
        'artistic.suggestions.generated',
        expect.anything(),
      );
    });
  });

  // ── initArtisticConsilium ─────────────────────────────────────────────

  describe('initArtisticConsilium', () => {
    it('calls onHint when uda.created is emitted', () => {
      const onHint = vi.fn();
      initArtisticConsilium(onHint);

      cognitionBus.emit('uda.created', { udaId: 'u1' });

      expect(onHint).toHaveBeenCalledOnce();
      const hint = onHint.mock.calls[0][0];
      expect(hint.actionKey).toBe('artistic.open');
      expect(hint.id).toMatch(/^artistic\.quick\./);
    });

    it('calls onHint when planning.wizard.completed is emitted', () => {
      const onHint = vi.fn();
      initArtisticConsilium(onHint);

      cognitionBus.emit('planning.wizard.completed', {});

      expect(onHint).toHaveBeenCalledOnce();
      const hint = onHint.mock.calls[0][0];
      expect(hint.actionKey).toBe('artistic.open');
      expect(hint.id).toMatch(/^artistic\.planning\./);
    });

    it('calls onHint when kb.document.uploaded is emitted', () => {
      const onHint = vi.fn();
      initArtisticConsilium(onHint);

      cognitionBus.emit('kb.document.uploaded', { docId: 'doc1' });

      expect(onHint).toHaveBeenCalledOnce();
      const hint = onHint.mock.calls[0][0];
      expect(hint.actionKey).toBe('artistic.open');
      expect(hint.id).toMatch(/^artistic\.kb\./);
    });

    it('calls onHint when feature.discovered is emitted for copilot feature', () => {
      const onHint = vi.fn();
      initArtisticConsilium(onHint);

      cognitionBus.emit('feature.discovered', { feature: 'copilot.panel' });

      expect(onHint).toHaveBeenCalledOnce();
      const hint = onHint.mock.calls[0][0];
      expect(hint.id).toMatch(/^artistic\.feature\./);
    });

    it('calls onHint when feature.discovered is emitted for planning feature', () => {
      const onHint = vi.fn();
      initArtisticConsilium(onHint);

      cognitionBus.emit('feature.discovered', { feature: 'planning' });

      expect(onHint).toHaveBeenCalledOnce();
    });

    it('does NOT call onHint for unrelated feature.discovered (e.g. classroom)', () => {
      const onHint = vi.fn();
      initArtisticConsilium(onHint);

      cognitionBus.emit('feature.discovered', { feature: 'classroom' });

      expect(onHint).not.toHaveBeenCalled();
    });

    it('calls onHint when workspace.configured is emitted', () => {
      const onHint = vi.fn();
      initArtisticConsilium(onHint);

      cognitionBus.emit('workspace.configured', {});

      expect(onHint).toHaveBeenCalledOnce();
      const hint = onHint.mock.calls[0][0];
      expect(hint.id).toMatch(/^artistic\.workspace\./);
    });

    it('is idempotent — second call does not double-register handlers', () => {
      const onHint = vi.fn();
      initArtisticConsilium(onHint);
      initArtisticConsilium(onHint); // second call must be ignored

      cognitionBus.emit('uda.created', { udaId: 'u2' });

      // Must have been called exactly once, not twice
      expect(onHint).toHaveBeenCalledOnce();
    });

    it('_resetArtisticConsilium allows re-initialization', () => {
      const onHint1 = vi.fn();
      initArtisticConsilium(onHint1);
      cognitionBus.emit('uda.created', { udaId: 'u3' });
      expect(onHint1).toHaveBeenCalledOnce();

      _resetArtisticConsilium();

      const onHint2 = vi.fn();
      initArtisticConsilium(onHint2);
      cognitionBus.emit('uda.created', { udaId: 'u4' });
      expect(onHint2).toHaveBeenCalledOnce();
    });
  });
});
