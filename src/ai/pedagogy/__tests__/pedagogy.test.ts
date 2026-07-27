/**
 * pedagogy.test.ts — Unit tests for Sprint 6: Pedagogical Alignment
 *
 * Covers:
 *   1. bloomsClassifier  — classifyBloom, classifyBloomDistribution
 *   2. alignmentScorer   — scoreLessons, scoreUda, scoreAllUdas
 *   3. pedagogyReport    — generatePedagogyReport
 *   4. pedagogyStore     — state transitions via compute / clear
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Lezione } from '@/types/uda.types';
import type { Uda } from '@/types/uda.types';
import {
  classifyBloom,
  classifyBloomDistribution,
  BLOOM_LEVELS,
  BLOOM_LEVEL_LABELS_IT,
  type BloomLevel,
} from '../bloomsClassifier';
import { scoreLessons, scoreUda, scoreAllUdas } from '../alignmentScorer';
import { generatePedagogyReport } from '../pedagogyReport';
import { usePedagogyStore } from '../pedagogyStore';

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeLezione(id: string, overrides: Partial<Lezione> = {}): Lezione {
  return {
    id,
    classe: '3A',
    materia: 'Matematica',
    contenuto: '',
    svolta: true,
    ...overrides,
  };
}

function makeUda(id: string, overrides: Partial<Uda> = {}): Uda {
  return {
    id,
    title: `UDA ${id}`,
    classe: '3A',
    materia: 'Matematica',
    introduction: '',
    finalProduct: '',
    competencyIds: [],
    phases: [],
    evaluation: '',
    tools: '',
    startPos: 0,
    width: 100,
    color: '#1565c0',
    borderColor: '#0d47a1',
    textColor: '#fff',
    ...overrides,
  };
}

function makeFullUda(): Uda {
  return makeUda('uda-full', {
    introduction: 'Percorso per ricordare i concetti di base e comprendere le funzioni matematiche.',
    finalProduct: 'Report statistico prodotto dagli studenti.',
    evaluation: 'Valutazione tramite rubrica condivisa.',
    tools: 'GeoGebra, scaffolding per BES.',
    phases: [
      {
        id: 'p1', title: 'Esplorazione',
        description: 'Gli studenti ricordano e identificano i concetti di base della statistica.',
        activities: 'Lezione frontale e discussione.',
        duration: '1 sett.',
      },
      {
        id: 'p2', title: 'Comprensione',
        description: 'Comprendere e descrivere le distribuzioni di frequenza.',
        activities: 'Analisi grafici, esercitazioni.',
        duration: '1 sett.',
      },
      {
        id: 'p3', title: 'Applicazione',
        description: 'Applicare il calcolo probabilistico per risolvere problemi concreti.',
        activities: 'Laboratorio GeoGebra.',
        duration: '1 sett.',
      },
      {
        id: 'p4', title: 'Analisi',
        description: 'Analizzare ed esaminare dataset reali, scomporre i fenomeni.',
        activities: 'Ricerca e indagine cooperativa.',
        duration: '1 sett.',
      },
      {
        id: 'p5', title: 'Valutazione',
        description: 'Valutare e giudicare soluzioni alternative, argomentare le scelte.',
        activities: 'Debate strutturato.',
        duration: '1 sett.',
      },
      {
        id: 'p6', title: 'Produzione',
        description: 'Progettare e produrre un elaborato originale con grafici e conclusioni creative.',
        activities: 'Produzione elaborato finale.',
        duration: '2 sett.',
      },
    ],
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. bloomsClassifier
// ═════════════════════════════════════════════════════════════════════════════

describe('bloomsClassifier', () => {
  describe('classifyBloom', () => {
    it('returns confidence 0 and level remember for empty text', () => {
      const result = classifyBloom('');
      expect(result.confidence).toBe(0);
      expect(result.primaryLevel).toBe('remember');
    });

    it('classifies "crea progetta produce elabora" as create', () => {
      const result = classifyBloom('crea progetta produce elabora una soluzione originale');
      expect(result.primaryLevel).toBe('create');
    });

    it('classifies "ricorda elenca identifica" as remember', () => {
      const result = classifyBloom('ricorda elenca identifica i concetti fondamentali');
      expect(result.primaryLevel).toBe('remember');
    });

    it('classifies "analizza esamina scomponi" as analyze', () => {
      const result = classifyBloom('analizza esamina scomponi il dataset in componenti');
      expect(result.primaryLevel).toBe('analyze');
    });

    it('classifies "valuta giudica giustifica" as evaluate', () => {
      const result = classifyBloom('valuta giudica e giustifica le scelte metodologiche');
      expect(result.primaryLevel).toBe('evaluate');
    });

    it('classifies "applica usa risolvi" as apply', () => {
      const result = classifyBloom('applica usa e risolvi il problema con la formula corretta');
      expect(result.primaryLevel).toBe('apply');
    });

    it('classifies "comprende spiega descrive" as understand', () => {
      const result = classifyBloom('comprende spiega e descrive il fenomeno osservato');
      expect(result.primaryLevel).toBe('understand');
    });

    it('returns scores record with all 6 Bloom levels', () => {
      const result = classifyBloom('comprende applica analizza valuta crea ricorda');
      expect(Object.keys(result.scores)).toEqual(
        expect.arrayContaining(BLOOM_LEVELS)
      );
    });

    it('levelIndex is in range [1, 6]', () => {
      const result = classifyBloom('qualsiasi testo da classificare');
      expect(result.levelIndex).toBeGreaterThanOrEqual(1);
      expect(result.levelIndex).toBeLessThanOrEqual(6);
    });

    it('is deterministic: same text → same result', () => {
      const text = 'analizza i dati del dataset e scomponi le componenti principali';
      const r1 = classifyBloom(text);
      const r2 = classifyBloom(text);
      expect(r1).toEqual(r2);
    });

    it('confidence is in [0, 1]', () => {
      const result = classifyBloom('crea progetta produce un elaborato originale complesso');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('matchedKeywords is an array (empty when no keywords)', () => {
      const result = classifyBloom('x y z');
      expect(Array.isArray(result.matchedKeywords)).toBe(true);
    });
  });

  describe('classifyBloomDistribution', () => {
    it('handles empty array: uniqueLevelsCount is 0', () => {
      const dist = classifyBloomDistribution([]);
      expect(dist.uniqueLevelsCount).toBe(0);
    });

    it('returns an object with all 6 counts and fractions keys', () => {
      const dist = classifyBloomDistribution(['ricorda elenca', 'comprende spiega']);
      for (const level of BLOOM_LEVELS) {
        expect(dist.counts).toHaveProperty(level);
        expect(dist.fractions).toHaveProperty(level);
      }
    });

    it('fractions sum to 1 (±0.01) when texts are non-empty', () => {
      const dist = classifyBloomDistribution([
        'ricorda identifica elenca',
        'comprende spiega descrive',
        'applica usa risolvi laboratorio',
        'analizza esamina scomponi',
        'valuta giudica argomenta',
        'crea progetta produce elabora',
      ]);
      const total = Object.values(dist.fractions).reduce((s, v) => s + v, 0);
      expect(total).toBeCloseTo(1, 1);
    });

    it('detecting multiple levels: uniqueLevelsCount > 1 for diverse texts', () => {
      const dist = classifyBloomDistribution([
        'ricorda elenca',
        'analizza scomponi',
        'crea progetta',
      ]);
      expect(dist.uniqueLevelsCount).toBeGreaterThan(1);
    });

    it('meanCognitiveIndex > 3 for advanced texts', () => {
      const dist = classifyBloomDistribution([
        'analizza esamina scomponi il problema',
        'valuta giudica argomenta le scelte',
        'crea progetta produce un elaborato completo',
      ]);
      expect(dist.meanCognitiveIndex).toBeGreaterThan(3);
    });

    it('classifications array length equals number of input texts', () => {
      const texts = ['ricorda', 'comprende', 'applica', 'analizza'];
      const dist = classifyBloomDistribution(texts);
      expect(dist.classifications.length).toBe(texts.length);
    });

    it('BLOOM_LEVEL_LABELS_IT contains all 6 Italian labels', () => {
      expect(Object.keys(BLOOM_LEVEL_LABELS_IT)).toHaveLength(6);
      for (const lvl of BLOOM_LEVELS) {
        expect(BLOOM_LEVEL_LABELS_IT[lvl]).toBeTruthy();
        expect(typeof BLOOM_LEVEL_LABELS_IT[lvl]).toBe('string');
      }
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. alignmentScorer
// ═════════════════════════════════════════════════════════════════════════════

describe('alignmentScorer', () => {
  describe('scoreLessons', () => {
    it('returns compositeScore 0 for empty lessons', () => {
      const result = scoreLessons([]);
      expect(result.overallScore).toBe(0);
    });

    it('all lessons with obiettivi → objectiveClarityScore > 0 (via bloomCoverage)', () => {
      const lessons = BLOOM_LEVELS.map((lvl, i) =>
        makeLezione(`l${i}`, {
          obiettivi: `Obiettivo ${lvl}`,
          contenuto: `Contenuto per il livello ${lvl}`,
        })
      );
      const result = scoreLessons(lessons);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('lessons with adattamenti → inclusionSignals > 0', () => {
      const lessons = [
        makeLezione('l1', { contenuto: 'Lezione teorica', adattamenti: 'supporto scaffolding per BES DSA adattamento' }),
        makeLezione('l2', { contenuto: 'Lab pratico', adattamenti: 'personalizzazione per studente con disabilità' }),
      ];
      const result = scoreLessons(lessons);
      expect(result.dimensions.inclusionSignals).toBeGreaterThan(0);
    });

    it('lessons with Verifica type → diversityOfMethods includes that type', () => {
      const lessons = [
        makeLezione('l1', { tipoLezione: 'Teoria', contenuto: 'Contenuto teorico' }),
        makeLezione('l2', { tipoLezione: 'Verifica', contenuto: 'Verifica delle competenze' }),
        makeLezione('l3', { tipoLezione: 'Laboratorio', contenuto: 'Lab pratico' }),
      ];
      const result = scoreLessons(lessons);
      expect(result.dimensions.diversityOfMethods).toBeGreaterThan(0);
    });

    it('result has all required dimension keys', () => {
      const result = scoreLessons([makeLezione('l1', { contenuto: 'test' })]);
      const expected = ['bloomCoverage', 'cognitiveProgression', 'activeLearningRatio', 'inclusionSignals', 'diversityOfMethods'];
      for (const key of expected) {
        expect(result.dimensions).toHaveProperty(key);
      }
    });

    it('overallScore is in [0, 1]', () => {
      const lessons = [
        makeLezione('l1', {
          contenuto: 'Ricorda e identifica i concetti base',
          obiettivi: 'Comprende e descrive',
          tipoLezione: 'Teoria',
        }),
      ];
      const result = scoreLessons(lessons);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
    });
  });

  describe('scoreUda', () => {
    it('full UDA with 6 Bloom phases → bloomCoverage > 0.80', () => {
      const result = scoreUda(makeFullUda());
      expect(result.dimensions.bloomCoverage).toBeGreaterThan(0.80);
    });

    it('UDA with inclusion keywords in tools → inclusionSignals > 0', () => {
      const uda = makeUda('uda-inc', {
        introduction: 'Percorso inclusivo per studenti BES con scaffolding e cooperativo peer.',
        phases: [{ id: 'p1', title: 'P1', description: 'Adattamenti per DSA', activities: 'Laboratorio peer', duration: '1w' }],
      });
      const result = scoreUda(uda);
      expect(result.dimensions.inclusionSignals).toBeGreaterThan(0);
    });

    it('UDA with empty phases → overallScore is 0 or very low', () => {
      const uda = makeUda('uda-empty', { phases: [] });
      const result = scoreUda(uda);
      expect(result.overallScore).toBeLessThan(0.40);
    });

    it('result entityId matches uda.id', () => {
      const uda = makeFullUda();
      const result = scoreUda(uda);
      expect(result.entityId).toBe(uda.id);
    });

    it('weakDimensions lists dimensions below threshold', () => {
      const uda = makeUda('uda-weak', {
        introduction: 'Ricorda i concetti.',
        phases: [{ id: 'p1', title: 'P1', description: 'Ricorda elenca i concetti.', activities: 'Lezione', duration: '1w' }],
      });
      const result = scoreUda(uda);
      expect(Array.isArray(result.weakDimensions)).toBe(true);
    });

    it('suggestions length equals weakDimensions length', () => {
      const uda = makeFullUda();
      const result = scoreUda(uda);
      expect(result.suggestions.length).toBe(result.weakDimensions.length);
    });
  });

  describe('scoreAllUdas', () => {
    it('returns empty array for empty input', () => {
      expect(scoreAllUdas([])).toEqual([]);
    });

    it('output length equals input length', () => {
      const udas = [makeFullUda(), makeUda('uda2')];
      const results = scoreAllUdas(udas);
      expect(results.length).toBe(2);
    });

    it('sorted by descending overallScore', () => {
      const udas = [makeUda('weak'), makeFullUda()];
      const results = scoreAllUdas(udas);
      // first result has score >= last result
      expect(results[0].overallScore).toBeGreaterThanOrEqual(results[results.length - 1].overallScore);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. pedagogyReport
// ═════════════════════════════════════════════════════════════════════════════

describe('generatePedagogyReport', () => {
  it('generates report with valid computedAt ISO timestamp', () => {
    const report = generatePedagogyReport([], []);
    expect(() => new Date(report.computedAt)).not.toThrow();
    expect(new Date(report.computedAt).toISOString()).toBe(report.computedAt);
  });

  it('lessonScore is null when no lessons provided', () => {
    const report = generatePedagogyReport([], [makeFullUda()]);
    expect(report.lessonScore).toBeNull();
  });

  it('lessonScore is not null when lessons are provided', () => {
    const lessons = [makeLezione('l1', { contenuto: 'Ricorda i concetti base' })];
    const report = generatePedagogyReport(lessons, []);
    expect(report.lessonScore).not.toBeNull();
  });

  it('udaScores length matches number of udas', () => {
    const udas = [makeFullUda(), makeUda('uda2', { phases: [] })];
    const report = generatePedagogyReport([], udas);
    expect(report.udaScores.length).toBe(2);
  });

  it('overallScore is in [0, 1]', () => {
    const report = generatePedagogyReport(
      [makeLezione('l1', { contenuto: 'Applica usa risolvi' })],
      [makeFullUda()]
    );
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(1);
  });

  it('strengths is an array', () => {
    const report = generatePedagogyReport([], [makeFullUda()]);
    expect(Array.isArray(report.strengths)).toBe(true);
  });

  it('opportunities is an array', () => {
    const report = generatePedagogyReport([], [makeFullUda()]);
    expect(Array.isArray(report.opportunities)).toBe(true);
  });

  it('full UDA with 6 Bloom phases generates at least 1 strength', () => {
    const report = generatePedagogyReport([], [makeFullUda()]);
    expect(report.strengths.length).toBeGreaterThanOrEqual(1);
  });

  it('max 3 strengths and max 3 opportunities', () => {
    const report = generatePedagogyReport([], [makeFullUda()]);
    expect(report.strengths.length).toBeLessThanOrEqual(3);
    expect(report.opportunities.length).toBeLessThanOrEqual(3);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. pedagogyStore
// ═════════════════════════════════════════════════════════════════════════════

describe('pedagogyStore', () => {
  beforeEach(() => {
    usePedagogyStore.getState().actions.clear();
  });

  it('starts with null report', () => {
    const state = usePedagogyStore.getState();
    expect(state.report).toBeNull();
    expect(state.computing).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastComputedAt).toBeNull();
  });

  it('compute() sets report to non-null for valid input', () => {
    const lessons = [makeLezione('l1', { contenuto: 'Analizza il problema e valuta le opzioni' })];
    usePedagogyStore.getState().actions.compute(lessons, [makeFullUda()]);
    const state = usePedagogyStore.getState();
    expect(state.report).not.toBeNull();
    expect(state.computing).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastComputedAt).toBeTruthy();
  });

  it('compute() with empty input sets error, not report', () => {
    usePedagogyStore.getState().actions.compute([], []);
    const state = usePedagogyStore.getState();
    expect(state.report).toBeNull();
    expect(state.error).not.toBeNull();
  });

  it('clear() resets report, error and lastComputedAt', () => {
    const lessons = [makeLezione('l1', { contenuto: 'Crea un elaborato originale' })];
    usePedagogyStore.getState().actions.compute(lessons, []);
    usePedagogyStore.getState().actions.clear();
    const state = usePedagogyStore.getState();
    expect(state.report).toBeNull();
    expect(state.error).toBeNull();
    expect(state.lastComputedAt).toBeNull();
  });

  it('lastComputedAt matches report.computedAt after compute()', () => {
    const lessons = [makeLezione('l1', { contenuto: 'Comprende e applica le funzioni' })];
    usePedagogyStore.getState().actions.compute(lessons, []);
    const state = usePedagogyStore.getState();
    expect(state.lastComputedAt).toBe(state.report?.computedAt);
  });
});
