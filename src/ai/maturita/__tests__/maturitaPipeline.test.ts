/**
 * maturitaPipeline.test.ts — Unit tests for the Maturità AI pipeline
 *
 * Tests:
 *   1. Empty data → returns 6 sections with safe defaults
 *   2. Lessons without objectives → low curriculum score, generates blockers
 *   3. Good lessons + UDA → higher curriculum/pedagogy scores
 *   4. With students + evaluations → trust section computed from real data
 *   5. Section IDs are stable and in correct order
 *   6. All scores in [0, 100] range
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  runMaturitaPipeline,
  type MaturitaPipelineParams,
} from '../maturitaPipeline';
import type { Studente } from '@/types/student.types';
import type { Valutazione } from '@/types/student.types';
import type { Lezione, Uda } from '@/types/uda.types';
import { _resetCurSeqForTesting } from '../../recommendation/curriculumAdvisor';

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeStudent(id: string): Studente {
  return { id, nome: 'Mario', cognome: 'Rossi', classe: '3A' };
}

function makeValutazione(
  id: string,
  studenteId: string,
  voto: string,
  data = '2026-01-15',
): Valutazione {
  return {
    id,
    studenteId,
    materia: 'Matematica',
    data,
    tipo: 'Scritto',
    voto,
  };
}

function makeLezione(
  id: string,
  contenuto: string,
  tipoLezione: Lezione['tipoLezione'] = 'Teoria',
  obiettivi?: string,
): Lezione {
  return {
    id,
    classe: '3A',
    materia: 'Matematica',
    contenuto,
    svolta: true,
    tipoLezione,
    obiettivi,
    data: '2026-01-10',
  };
}

function makeUda(id: string): Uda {
  return {
    id,
    title: `UDA ${id}`,
    classe: '3A',
    materia: 'Matematica',
    introduction: 'Introduzione al tema',
    finalProduct: 'Prodotto finale',
    competencyIds: [],
    phases: [
      {
        id: `${id}-p1`,
        title: 'Fase 1',
        description: 'Prima fase',
        activities: 'Quiz e verifica',
        duration: '2 settimane',
      },
    ],
    evaluation: 'Verifica scritta',
    tools: 'Lavagna digitale',
    startPos: 0,
    width: 100,
    color: '#e3f2fd',
    borderColor: '#1976d2',
    textColor: '#000',
  };
}

// ── Baseline empty params ─────────────────────────────────────────────────────

const EMPTY_PARAMS: MaturitaPipelineParams = {
  students: [],
  evaluations: [],
  lessons: [],
  udas: [],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runMaturitaPipeline', () => {
  beforeEach(() => {
    _resetCurSeqForTesting();
  });

  describe('output structure', () => {
    it('returns exactly 6 sections', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      expect(sections).toHaveLength(6);
    });

    it('returns sections with the correct IDs in order', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      const ids = sections.map((s) => s.id);
      expect(ids).toEqual([
        'pedagogia',
        'trust',
        'curriculum',
        'gdpr',
        'accessibilita',
        'pa_readiness',
      ]);
    });

    it('all scores are in [0, 100]', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      for (const s of sections) {
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
      }
    });

    it('all sections have a lastUpdated ISO timestamp', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      for (const s of sections) {
        expect(s.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    });

    it('all weights sum to 1.00', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      const total = sections.reduce((acc, s) => acc + s.weight, 0);
      expect(total).toBeCloseTo(1.0, 5);
    });
  });

  describe('curriculum section', () => {
    it('returns score=50 when there are fewer than 2 lessons', () => {
      const sections = runMaturitaPipeline({ ...EMPTY_PARAMS, lessons: [makeLezione('l1', 'Frazioni')] });
      const curriculum = sections.find((s) => s.id === 'curriculum')!;
      expect(curriculum.score).toBe(50);
    });

    it('returns higher score with balanced lessons (no gaps)', () => {
      // 4 lessons with diverse types and objectives → few/no recommendations → high score
      const lessons: Lezione[] = [
        makeLezione('l1', 'Frazioni', 'Teoria', 'Comprendere le frazioni'),
        makeLezione('l2', 'Frazioni addizione', 'Laboratorio', 'Applicare le frazioni'),
        makeLezione('l3', 'Frazioni moltiplicazione', 'Verifica', 'Verificare la comprensione'),
        makeLezione('l4', 'Frazioni divisione', 'Teoria', 'Analizzare casi d\'uso'),
      ];
      const sections = runMaturitaPipeline({ ...EMPTY_PARAMS, lessons });
      const curriculum = sections.find((s) => s.id === 'curriculum')!;
      // Score > 50 with balanced lessons
      expect(curriculum.score).toBeGreaterThan(50);
    });

    it('blockers only include items with impactScore >= 0.50', () => {
      const lessons: Lezione[] = Array.from({ length: 10 }, (_, i) =>
        makeLezione(`l${i}`, `Argomento diverso ${i}`, 'Teoria')
      );
      const sections = runMaturitaPipeline({ ...EMPTY_PARAMS, lessons });
      const curriculum = sections.find((s) => s.id === 'curriculum')!;
      for (const blocker of curriculum.blockers) {
        expect(['critica', 'media']).toContain(blocker.severita);
      }
    });
  });

  describe('pedagogia section', () => {
    it('returns score=0 with empty lessons (overallScore from PedagogyReport is 0)', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      const pedagogia = sections.find((s) => s.id === 'pedagogia')!;
      expect(pedagogia.score).toBe(0);
    });

    it('returns score > 0 when lessons have objectives and variety', () => {
      const lessons: Lezione[] = [
        makeLezione('l1', 'Contenuto 1', 'Teoria', 'Ricordare i concetti base'),
        makeLezione('l2', 'Contenuto 2', 'Laboratorio', 'Applicare le competenze'),
        makeLezione('l3', 'Contenuto 3', 'Verifica', 'Valutare i risultati'),
        makeLezione('l4', 'Contenuto 4', 'Teoria', 'Analizzare i problemi'),
      ];
      const sections = runMaturitaPipeline({ ...EMPTY_PARAMS, lessons });
      const pedagogia = sections.find((s) => s.id === 'pedagogia')!;
      expect(pedagogia.score).toBeGreaterThan(0);
    });

    it('blockers derive from pedagogy opportunities', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      const pedagogia = sections.find((s) => s.id === 'pedagogia')!;
      // With empty lessons, pedagogyReport.opportunities may be non-empty
      for (const blocker of pedagogia.blockers) {
        expect(blocker.azioneSuggerita).toBe(
          'Rivedi il piano lezioni in base ai suggerimenti AI'
        );
      }
    });
  });

  describe('trust section', () => {
    it('returns a fallback trust section when students array is empty', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      const trust = sections.find((s) => s.id === 'trust')!;
      expect(trust.score).toBe(50);
      expect(trust.blockers[0].id).toBe('trst-ns');
    });

    it('computes trust from real data when students are present', () => {
      const students = [makeStudent('s1'), makeStudent('s2')];
      const evaluations = [
        makeValutazione('v1', 's1', '8', '2026-01-10'),
        makeValutazione('v2', 's1', '7', '2026-02-10'),
        makeValutazione('v3', 's1', '9', '2026-03-01'),
        makeValutazione('v4', 's2', '5', '2026-01-15'),
        makeValutazione('v5', 's2', '6', '2026-02-15'),
        makeValutazione('v6', 's2', '5', '2026-03-05'),
      ];
      const sections = runMaturitaPipeline({ ...EMPTY_PARAMS, students, evaluations });
      const trust = sections.find((s) => s.id === 'trust')!;
      // Score should be in range and not the fallback 50
      // With limited data trust will be low-moderate but not fallback
      expect(trust.score).toBeGreaterThanOrEqual(0);
      expect(trust.score).toBeLessThanOrEqual(100);
      expect(trust.blockers.some((b) => b.id === 'trst-ns')).toBe(false);
    });

    it('trust score is higher with more student evaluations', () => {
      const students = [makeStudent('s1')];

      const fewEvals = [makeValutazione('v1', 's1', '7')];
      const manyEvals = Array.from({ length: 10 }, (_, i) =>
        makeValutazione(`v${i}`, 's1', String(6 + (i % 3)), `2026-0${(i % 3) + 1}-${String(i + 1).padStart(2, '0')}`)
      );

      const sectionsLow = runMaturitaPipeline({ ...EMPTY_PARAMS, students, evaluations: fewEvals });
      const sectionsHigh = runMaturitaPipeline({ ...EMPTY_PARAMS, students, evaluations: manyEvals });

      const trustLow = sectionsLow.find((s) => s.id === 'trust')!.score;
      const trustHigh = sectionsHigh.find((s) => s.id === 'trust')!.score;

      expect(trustHigh).toBeGreaterThanOrEqual(trustLow);
    });
  });

  describe('compliance sections (gdpr, accessibilita, pa_readiness)', () => {
    it('gdpr section has score=45 and 2 critical blockers', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      const gdpr = sections.find((s) => s.id === 'gdpr')!;
      expect(gdpr.score).toBe(45);
      expect(gdpr.blockers.filter((b) => b.severita === 'critica')).toHaveLength(2);
    });

    it('pa_readiness section has score=30 and at least 2 critical blockers', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      const pa = sections.find((s) => s.id === 'pa_readiness')!;
      expect(pa.score).toBe(30);
      expect(pa.blockers.filter((b) => b.severita === 'critica').length).toBeGreaterThanOrEqual(2);
    });

    it('accessibilita section has score=60', () => {
      const sections = runMaturitaPipeline(EMPTY_PARAMS);
      const acc = sections.find((s) => s.id === 'accessibilita')!;
      expect(acc.score).toBe(60);
    });

    it('compliance sections are not affected by student/lesson data', () => {
      const students = [makeStudent('s1')];
      const evaluations = [makeValutazione('v1', 's1', '8')];
      const lessons = [makeLezione('l1', 'Test', 'Teoria', 'Capire')];

      const sections = runMaturitaPipeline({ students, evaluations, lessons, udas: [] });
      const gdpr = sections.find((s) => s.id === 'gdpr')!;
      const acc = sections.find((s) => s.id === 'accessibilita')!;
      const pa = sections.find((s) => s.id === 'pa_readiness')!;

      expect(gdpr.score).toBe(45);
      expect(acc.score).toBe(60);
      expect(pa.score).toBe(30);
    });
  });

  describe('three interaction modes (pipeline-level behaviour)', () => {
    // The pipeline itself is mode-agnostic — modes govern UI rendering only.
    // This test documents that the same pipeline result is consumed by all modes.
    it('pipeline output is deterministic regardless of current interaction mode', () => {
      const sections1 = runMaturitaPipeline(EMPTY_PARAMS);
      const sections2 = runMaturitaPipeline(EMPTY_PARAMS);
      expect(sections1.map((s) => s.score)).toEqual(sections2.map((s) => s.score));
      expect(sections1.map((s) => s.id)).toEqual(sections2.map((s) => s.id));
    });
  });
});
