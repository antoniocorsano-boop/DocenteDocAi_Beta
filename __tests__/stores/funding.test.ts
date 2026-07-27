// @ts-nocheck
/**
 * funding.test.ts — Test suite per il modulo Finanziamenti e Bandi
 *
 * Copre:
 *   - computeFundingReport() — logica core
 *   - classifyAIMaturita()
 *   - generateCandidaturaDraft()
 *   - simulateApprovazione()
 *   - refreshBandiFromAPI()
 *   - useFundingStore — actions: compute, clear, trackSubmission, readyToSubmit, updateCompliance, simulateBando
 *   - Compliance pipeline, validazione documenti, edge cases
 *
 * Mock: lessons, students, udas, projectType
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  computeFundingReport,
  classifyAIMaturita,
  generateCandidaturaDraft,
  simulateApprovazione,
  refreshBandiFromAPI,
  BANDI_CATALOGO,
} from '../../src/ai/funding/FundingAI';
import { useFundingStore } from '../../src/stores/useFundingStore';
import type { Lezione, Studente } from '../../src/types';
import type {
  ProjectType,
  UserFundingProfile,
  ComplianceCheck,
} from '../../src/types/funding.types';

// ── Mock data ─────────────────────────────────────────────────────────────────

function makeLezione(overrides: Partial<Lezione> = {}): Lezione {
  return {
    id: `lez-${Math.random().toString(36).slice(2)}`,
    classe: '3A',
    materia: 'Matematica',
    contenuto: 'Lezione di test',
    svolta: true,
    data: '2026-01-15',
    ...overrides,
  };
}

function makeStudente(overrides: Partial<Studente> = {}): Studente {
  return {
    id: `stu-${Math.random().toString(36).slice(2)}`,
    nome: 'Mario',
    cognome: 'Rossi',
    classe: '3A',
    ...overrides,
  };
}

const MOCK_LESSONS_HIGH: Lezione[] = Array.from({ length: 25 }, (_, i) =>
  makeLezione({ id: `lez-${i}`, udaId: i < 15 ? 'uda-1' : i < 22 ? 'uda-2' : 'uda-3' })
);

const MOCK_LESSONS_MEDIUM: Lezione[] = Array.from({ length: 10 }, (_, i) =>
  makeLezione({ id: `lez-${i}`, udaId: i < 5 ? 'uda-1' : undefined })
);

const MOCK_LESSONS_LOW: Lezione[] = Array.from({ length: 3 }, (_, i) =>
  makeLezione({ id: `lez-${i}` })
);

const MOCK_STUDENTS_20: Studente[] = Array.from({ length: 20 }, (_, i) =>
  makeStudente({ id: `stu-${i}` })
);

const MOCK_STUDENTS_5: Studente[] = Array.from({ length: 5 }, (_, i) =>
  makeStudente({ id: `stu-${i}` })
);

const MOCK_PROFILE_FULL: UserFundingProfile = {
  className: '3A',
  istituto: 'IIS Test',
  regione: 'Lombardia',
  hasSpid: true,
  hasGdprRegistry: true,
  hasDpa: true,
  hasSla: true,
};

const MOCK_PROFILE_EMPTY: UserFundingProfile = {
  className: '3A',
};

// ── classifyAIMaturita ────────────────────────────────────────────────────────

describe('classifyAIMaturita()', () => {
  it('restituisce "alta" con 20+ lezioni e 3+ UDA', () => {
    expect(classifyAIMaturita(20, 3)).toBe('alta');
  });

  it('restituisce "alta" con 30 lezioni e 5 UDA', () => {
    expect(classifyAIMaturita(30, 5)).toBe('alta');
  });

  it('restituisce "media" con 8 lezioni e 0 UDA', () => {
    expect(classifyAIMaturita(8, 0)).toBe('media');
  });

  it('restituisce "media" con 5 lezioni e 1 UDA', () => {
    expect(classifyAIMaturita(5, 1)).toBe('media');
  });

  it('restituisce "media" con 0 lezioni e 1 UDA', () => {
    expect(classifyAIMaturita(0, 1)).toBe('media');
  });

  it('restituisce "bassa" con 3 lezioni e 0 UDA', () => {
    expect(classifyAIMaturita(3, 0)).toBe('bassa');
  });

  it('restituisce "bassa" con 0 lezioni e 0 UDA', () => {
    expect(classifyAIMaturita(0, 0)).toBe('bassa');
  });

  it('restituisce "alta" esattamente al threshold 20 lezioni, 3 UDA', () => {
    expect(classifyAIMaturita(20, 3)).toBe('alta');
  });

  it('restituisce "media" esattamente al threshold 8 lezioni, 0 UDA', () => {
    expect(classifyAIMaturita(8, 0)).toBe('media');
  });
});

// ── computeFundingReport ──────────────────────────────────────────────────────

describe('computeFundingReport()', () => {
  it('restituisce un FundingReport con projectType corretto', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_FULL, MOCK_LESSONS_HIGH, MOCK_STUDENTS_20);
    expect(report.projectType).toBe('Pilota AI');
  });

  it('restituisce opportunità di tipo "Pilota AI"', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_FULL, MOCK_LESSONS_HIGH, MOCK_STUDENTS_20);
    expect(report.fundingOpportunities.length).toBeGreaterThan(0);
    report.fundingOpportunities.forEach((b) => {
      expect(b.tipoProgetto).toContain('Pilota AI');
    });
  });

  it('restituisce opportunità di tipo "Inclusione Digitale"', () => {
    const report = computeFundingReport('Inclusione Digitale', MOCK_PROFILE_FULL, MOCK_LESSONS_HIGH, MOCK_STUDENTS_20);
    expect(report.fundingOpportunities.length).toBeGreaterThan(0);
    report.fundingOpportunities.forEach((b) => {
      expect(b.tipoProgetto).toContain('Inclusione Digitale');
    });
  });

  it('complianceScore = 1.0 con profilo pieno', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_FULL, MOCK_LESSONS_HIGH, MOCK_STUDENTS_20);
    expect(report.complianceScore).toBe(1);
  });

  it('complianceScore = 0.0 con profilo vuoto', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_EMPTY, MOCK_LESSONS_LOW, MOCK_STUDENTS_5);
    expect(report.complianceScore).toBe(0);
  });

  it('complianceScore parziale (0.5) con 2 flag su 4', () => {
    const profile: UserFundingProfile = { className: '3A', hasGdprRegistry: true, hasSpid: true };
    const report = computeFundingReport('Curriculum Innovativo', profile, MOCK_LESSONS_MEDIUM, MOCK_STUDENTS_20);
    expect(report.complianceScore).toBe(0.5);
  });

  it('urgencyScore è tra 0 e 1', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_FULL, MOCK_LESSONS_HIGH, MOCK_STUDENTS_20);
    expect(report.urgencyScore).toBeGreaterThanOrEqual(0);
    expect(report.urgencyScore).toBeLessThanOrEqual(1);
  });

  it('contextStats.aiMaturita = "alta" con lezioni e UDA alte', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_FULL, MOCK_LESSONS_HIGH, MOCK_STUDENTS_20);
    expect(report.contextStats.aiMaturita).toBe('alta');
  });

  it('contextStats.aiMaturita = "bassa" con poche lezioni', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_EMPTY, MOCK_LESSONS_LOW, MOCK_STUDENTS_5);
    expect(report.contextStats.aiMaturita).toBe('bassa');
  });

  it('contextStats.studentCount corrisponde al numero di studenti forniti', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_FULL, MOCK_LESSONS_HIGH, MOCK_STUDENTS_20);
    expect(report.contextStats.studentCount).toBe(20);
  });

  it('contextStats.lessonCount corrisponde al numero di lezioni fornite', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_FULL, MOCK_LESSONS_HIGH, MOCK_STUDENTS_20);
    expect(report.contextStats.lessonCount).toBe(25);
  });

  it('documentsNeeded è non vuoto per ogni tipo progetto', () => {
    const types: ProjectType[] = ['Pilota AI', 'Curriculum Innovativo', 'Inclusione Digitale'];
    types.forEach((t) => {
      const report = computeFundingReport(t, MOCK_PROFILE_EMPTY, [], []);
      expect(report.documentsNeeded.length).toBeGreaterThan(0);
    });
  });

  it('recommendations contiene almeno 1 voce', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_EMPTY, MOCK_LESSONS_LOW, MOCK_STUDENTS_5);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('recommendations hanno priorita valida', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_EMPTY, MOCK_LESSONS_LOW, MOCK_STUDENTS_5);
    report.recommendations.forEach((r) => {
      expect(['alta', 'media', 'bassa']).toContain(r.priorita);
    });
  });

  it('generatedAt è un timestamp ISO valido', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_FULL, MOCK_LESSONS_HIGH, MOCK_STUDENTS_20);
    expect(() => new Date(report.generatedAt)).not.toThrow();
    expect(new Date(report.generatedAt).getTime()).toBeGreaterThan(0);
  });

  it('bandi ordinati per rilevanza (higher impactScore * urgencyScore prima)', () => {
    const report = computeFundingReport('Pilota AI', MOCK_PROFILE_FULL, MOCK_LESSONS_HIGH, MOCK_STUDENTS_20);
    const scores = report.fundingOpportunities.map((b) => b.impactScore * b.urgencyScore);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
    }
  });

  it('con profilo vuoto e 0 lezioni produce report valido (no errori)', () => {
    expect(() => computeFundingReport('Inclusione Digitale', MOCK_PROFILE_EMPTY, [], [])).not.toThrow();
  });

  it('non contiene bandi di tipo non-matching nel filtro', () => {
    const report = computeFundingReport('Inclusione Digitale', MOCK_PROFILE_EMPTY, [], []);
    report.fundingOpportunities.forEach((b) => {
      expect(b.tipoProgetto).toContain('Inclusione Digitale');
    });
  });
});

// ── generateCandidaturaDraft ──────────────────────────────────────────────────

describe('generateCandidaturaDraft()', () => {
  const bando = BANDI_CATALOGO[0];

  it('genera una stringa non vuota', () => {
    const draft = generateCandidaturaDraft(bando, 'Pilota AI', MOCK_PROFILE_FULL, 25, 20);
    expect(typeof draft).toBe('string');
    expect(draft.length).toBeGreaterThan(100);
  });

  it('include il titolo del bando', () => {
    const draft = generateCandidaturaDraft(bando, 'Pilota AI', MOCK_PROFILE_FULL, 25, 20);
    expect(draft).toContain(bando.titolo);
  });

  it('include il nome istituto del profilo', () => {
    const draft = generateCandidaturaDraft(bando, 'Pilota AI', MOCK_PROFILE_FULL, 25, 20);
    expect(draft).toContain(MOCK_PROFILE_FULL.istituto!);
  });

  it('include il numero di lezioni', () => {
    const draft = generateCandidaturaDraft(bando, 'Pilota AI', MOCK_PROFILE_FULL, 17, 20);
    expect(draft).toContain('17');
  });

  it('include il numero di studenti', () => {
    const draft = generateCandidaturaDraft(bando, 'Pilota AI', MOCK_PROFILE_FULL, 25, 18);
    expect(draft).toContain('18');
  });

  it('include la sezione GDPR/compliance requirements', () => {
    const draft = generateCandidaturaDraft(bando, 'Pilota AI', MOCK_PROFILE_FULL, 25, 20);
    expect(draft.toLowerCase()).toContain('requisiti');
  });

  it('include nota "BOZZA" in output', () => {
    const draft = generateCandidaturaDraft(bando, 'Pilota AI', MOCK_PROFILE_FULL, 25, 20);
    expect(draft).toContain('BOZZA');
  });

  it('funziona con profilo minimale (no istituto)', () => {
    const draft = generateCandidaturaDraft(bando, 'Inclusione Digitale', MOCK_PROFILE_EMPTY, 5, 10);
    expect(draft.length).toBeGreaterThan(50);
  });

  it('budget breakdown appare quando presente nel bando', () => {
    const bandoConBreakdown = BANDI_CATALOGO.find((b) => b.budgetBreakdown && b.budgetBreakdown.length > 0)!;
    const draft = generateCandidaturaDraft(bandoConBreakdown, 'Pilota AI', MOCK_PROFILE_FULL, 10, 15);
    expect(draft).toContain('%');
  });
});

// ── simulateApprovazione ──────────────────────────────────────────────────────

describe('simulateApprovazione()', () => {
  const bando = BANDI_CATALOGO[0];
  const complianceFull: ComplianceCheck = { gdpr: true, spid: true, dpa: true, sla: true };
  const complianceNone: ComplianceCheck = { gdpr: false, spid: false, dpa: false, sla: false };

  it('probabilita è tra 0 e 1', () => {
    const sim = simulateApprovazione(bando, complianceFull, 25, 20, 'alta');
    expect(sim.probabilita).toBeGreaterThanOrEqual(0);
    expect(sim.probabilita).toBeLessThanOrEqual(1);
  });

  it('probabilita più alta con compliance piena vs nessuna', () => {
    const simFull = simulateApprovazione(bando, complianceFull, 25, 20, 'alta');
    const simNone = simulateApprovazione(bando, complianceNone, 3, 5, 'bassa');
    expect(simFull.probabilita).toBeGreaterThan(simNone.probabilita);
  });

  it('restituisce bandoId corretto', () => {
    const sim = simulateApprovazione(bando, complianceFull, 20, 18, 'media');
    expect(sim.bandoId).toBe(bando.id);
  });

  it('fattoriPositivi contiene "GDPR conforme" quando gdpr=true', () => {
    const sim = simulateApprovazione(bando, complianceFull, 20, 18, 'media');
    expect(sim.fattoriPositivi).toContain('GDPR conforme');
  });

  it('fattoriRischio contiene avviso GDPR quando gdpr=false', () => {
    const sim = simulateApprovazione(bando, complianceNone, 5, 5, 'bassa');
    expect(sim.fattoriRischio.some((f) => f.toLowerCase().includes('gdpr'))).toBe(true);
  });

  it('maturità alta aumenta probabilita rispetto a bassa', () => {
    const simAlta = simulateApprovazione(bando, complianceFull, 25, 20, 'alta');
    const simBassa = simulateApprovazione(bando, complianceFull, 25, 20, 'bassa');
    expect(simAlta.probabilita).toBeGreaterThan(simBassa.probabilita);
  });

  it('suggerimenti non vuoti con compliance=none', () => {
    const sim = simulateApprovazione(bando, complianceNone, 3, 5, 'bassa');
    expect(sim.suggerimenti.length).toBeGreaterThan(0);
  });

  it('classe numerosa (>15) aggiunge fattore positivo', () => {
    const sim = simulateApprovazione(bando, complianceFull, 20, 20, 'media');
    expect(sim.fattoriPositivi.some((f) => f.includes('20 studenti'))).toBe(true);
  });
});

// ── refreshBandiFromAPI ───────────────────────────────────────────────────────

describe('refreshBandiFromAPI()', () => {
  it('restituisce un array non vuoto', async () => {
    const bandi = await refreshBandiFromAPI();
    expect(Array.isArray(bandi)).toBe(true);
    expect(bandi.length).toBeGreaterThan(0);
  });

  it('ogni bando ha id, titolo, scadenza', async () => {
    const bandi = await refreshBandiFromAPI();
    bandi.forEach((b) => {
      expect(typeof b.id).toBe('string');
      expect(typeof b.titolo).toBe('string');
      expect(typeof b.scadenza).toBe('string');
    });
  });

  it('ogni bando ha urgencyScore e impactScore tra 0 e 1', async () => {
    const bandi = await refreshBandiFromAPI();
    bandi.forEach((b) => {
      expect(b.urgencyScore).toBeGreaterThanOrEqual(0);
      expect(b.urgencyScore).toBeLessThanOrEqual(1);
      expect(b.impactScore).toBeGreaterThanOrEqual(0);
      expect(b.impactScore).toBeLessThanOrEqual(1);
    });
  });
});

// ── BANDI_CATALOGO ────────────────────────────────────────────────────────────

describe('BANDI_CATALOGO (catalogo statico)', () => {
  it('contiene almeno 3 bandi', () => {
    expect(BANDI_CATALOGO.length).toBeGreaterThanOrEqual(3);
  });

  it('ogni bando ha tipoProgetto non vuoto', () => {
    BANDI_CATALOGO.forEach((b) => {
      expect(b.tipoProgetto.length).toBeGreaterThan(0);
    });
  });

  it('ogni bando ha almeno 1 requisito', () => {
    BANDI_CATALOGO.forEach((b) => {
      expect(b.requisiti.length).toBeGreaterThan(0);
    });
  });

  it('copertura: esiste almeno 1 bando per ogni tipo progetto', () => {
    const types: ProjectType[] = ['Pilota AI', 'Curriculum Innovativo', 'Inclusione Digitale'];
    types.forEach((t) => {
      expect(BANDI_CATALOGO.some((b) => b.tipoProgetto.includes(t))).toBe(true);
    });
  });
});

// ── useFundingStore — actions ─────────────────────────────────────────────────

describe('useFundingStore', () => {
  beforeEach(() => {
    useFundingStore.setState({
      report: null,
      submissions: [],
      compliance: { gdpr: false, spid: false, sla: false, dpa: false },
      simulations: {},
      isLoading: false,
      error: null,
      lastBandiUpdate: null,
    });
  });

  describe('updateCompliance()', () => {
    it('aggiorna un singolo flag compliance', () => {
      useFundingStore.getState().actions.updateCompliance({ gdpr: true });
      expect(useFundingStore.getState().compliance.gdpr).toBe(true);
      expect(useFundingStore.getState().compliance.spid).toBe(false);
    });

    it('aggiorna più flag contemporaneamente', () => {
      useFundingStore.getState().actions.updateCompliance({ gdpr: true, spid: true });
      const c = useFundingStore.getState().compliance;
      expect(c.gdpr).toBe(true);
      expect(c.spid).toBe(true);
      expect(c.dpa).toBe(false);
    });

    it('non intacca gli altri flag quando aggiorna uno solo', () => {
      useFundingStore.setState({ compliance: { gdpr: true, spid: true, dpa: true, sla: false } });
      useFundingStore.getState().actions.updateCompliance({ sla: true });
      const c = useFundingStore.getState().compliance;
      expect(c.gdpr).toBe(true);
      expect(c.spid).toBe(true);
      expect(c.dpa).toBe(true);
      expect(c.sla).toBe(true);
    });
  });

  describe('readyToSubmit()', () => {
    it('restituisce false con compliance incompleta', () => {
      expect(useFundingStore.getState().actions.readyToSubmit()).toBe(false);
    });

    it('restituisce false con 3/4 flag attivi', () => {
      useFundingStore.getState().actions.updateCompliance({ gdpr: true, spid: true, dpa: true });
      expect(useFundingStore.getState().actions.readyToSubmit()).toBe(false);
    });

    it('restituisce true con tutti e 4 i flag attivi', () => {
      useFundingStore.getState().actions.updateCompliance({ gdpr: true, spid: true, dpa: true, sla: true });
      expect(useFundingStore.getState().actions.readyToSubmit()).toBe(true);
    });
  });

  describe('trackSubmission()', () => {
    it('aggiunge una nuova submission', () => {
      useFundingStore.getState().actions.trackSubmission('bando-1', 'bozza', ['doc1.pdf']);
      const subs = useFundingStore.getState().submissions;
      expect(subs.length).toBe(1);
      expect(subs[0].bandoId).toBe('bando-1');
      expect(subs[0].status).toBe('bozza');
    });

    it('aggiorna submission esistente (no duplicati)', () => {
      useFundingStore.getState().actions.trackSubmission('bando-1', 'bozza', ['doc1.pdf']);
      useFundingStore.getState().actions.trackSubmission('bando-1', 'inviato', ['doc1.pdf', 'doc2.pdf']);
      const subs = useFundingStore.getState().submissions;
      expect(subs.length).toBe(1);
      expect(subs[0].status).toBe('inviato');
      expect(subs[0].documents).toHaveLength(2);
    });

    it('imposta dataSottomissione quando status = "inviato"', () => {
      useFundingStore.getState().actions.trackSubmission('bando-1', 'inviato', []);
      const sub = useFundingStore.getState().submissions[0];
      expect(sub.dataSottomissione).toBeTruthy();
      expect(new Date(sub.dataSottomissione!).getTime()).toBeGreaterThan(0);
    });

    it('non imposta dataSottomissione per stato "bozza"', () => {
      useFundingStore.getState().actions.trackSubmission('bando-1', 'bozza', []);
      const sub = useFundingStore.getState().submissions[0];
      expect(sub.dataSottomissione).toBeUndefined();
    });

    it('gestisce più submission per bandi diversi', () => {
      useFundingStore.getState().actions.trackSubmission('bando-1', 'bozza', []);
      useFundingStore.getState().actions.trackSubmission('bando-2', 'inviato', ['doc.pdf']);
      useFundingStore.getState().actions.trackSubmission('bando-3', 'approvato', []);
      expect(useFundingStore.getState().submissions.length).toBe(3);
    });

    it('salva la nota nella submission', () => {
      useFundingStore.getState().actions.trackSubmission('bando-1', 'bozza', [], 'Note di test');
      expect(useFundingStore.getState().submissions[0].note).toBe('Note di test');
    });
  });

  describe('clear()', () => {
    it('azzera il report', () => {
      useFundingStore.setState({ report: { projectType: 'Pilota AI' } as any });
      useFundingStore.getState().actions.clear();
      expect(useFundingStore.getState().report).toBeNull();
    });

    it('azzera le simulazioni', () => {
      useFundingStore.setState({ simulations: { 'bando-1': { probabilita: 0.7 } as any } });
      useFundingStore.getState().actions.clear();
      expect(useFundingStore.getState().simulations).toEqual({});
    });

    it('non azzera le submission', () => {
      useFundingStore.getState().actions.trackSubmission('bando-1', 'bozza', []);
      useFundingStore.getState().actions.clear();
      expect(useFundingStore.getState().submissions.length).toBe(1);
    });

    it('non azzera la compliance', () => {
      useFundingStore.getState().actions.updateCompliance({ gdpr: true });
      useFundingStore.getState().actions.clear();
      expect(useFundingStore.getState().compliance.gdpr).toBe(true);
    });
  });

  describe('compute()', () => {
    it('produce un FundingReport nello store', async () => {
      await useFundingStore.getState().actions.compute(
        'Pilota AI',
        MOCK_PROFILE_FULL,
        MOCK_LESSONS_HIGH,
        MOCK_STUDENTS_20
      );
      expect(useFundingStore.getState().report).not.toBeNull();
      expect(useFundingStore.getState().report!.projectType).toBe('Pilota AI');
    });

    it('isLoading = false dopo il compute', async () => {
      await useFundingStore.getState().actions.compute(
        'Pilota AI',
        MOCK_PROFILE_FULL,
        MOCK_LESSONS_HIGH,
        MOCK_STUDENTS_20
      );
      expect(useFundingStore.getState().isLoading).toBe(false);
    });

    it('error = null dopo compute corretto', async () => {
      await useFundingStore.getState().actions.compute(
        'Curriculum Innovativo',
        MOCK_PROFILE_EMPTY,
        MOCK_LESSONS_LOW,
        []
      );
      expect(useFundingStore.getState().error).toBeNull();
    });
  });

  describe('simulateBando()', () => {
    it('restituisce null per bandoId inesistente', () => {
      const result = useFundingStore.getState().actions.simulateBando('non-esiste', 10, 15, 'media');
      expect(result).toBeNull();
    });

    it('salva la simulazione nello store', () => {
      const bandoId = BANDI_CATALOGO[0].id;
      useFundingStore.getState().actions.simulateBando(bandoId, 20, 18, 'alta');
      expect(useFundingStore.getState().simulations[bandoId]).toBeDefined();
    });

    it('risultato ha probabilita tra 0 e 1', () => {
      const bandoId = BANDI_CATALOGO[0].id;
      const result = useFundingStore.getState().actions.simulateBando(bandoId, 15, 20, 'media');
      expect(result!.probabilita).toBeGreaterThanOrEqual(0);
      expect(result!.probabilita).toBeLessThanOrEqual(1);
    });

    it('aggiorna probabilitaApprovazione nella submission se esiste', () => {
      const bandoId = BANDI_CATALOGO[0].id;
      useFundingStore.getState().actions.trackSubmission(bandoId, 'bozza', []);
      useFundingStore.getState().actions.simulateBando(bandoId, 20, 18, 'alta');
      const sub = useFundingStore.getState().submissions.find((s) => s.bandoId === bandoId);
      expect(sub?.probabilitaApprovazione).toBeDefined();
      expect(sub!.probabilitaApprovazione).toBeGreaterThanOrEqual(0);
    });
  });

  describe('setBozzaTestuale()', () => {
    it('salva la bozza nella submission corrispondente', () => {
      useFundingStore.getState().actions.trackSubmission('bando-1', 'bozza', []);
      useFundingStore.getState().actions.setBozzaTestuale('bando-1', 'TESTO DI TEST');
      const sub = useFundingStore.getState().submissions.find((s) => s.bandoId === 'bando-1');
      expect(sub?.bozzaTestuale).toBe('TESTO DI TEST');
    });

    it('non modifica altre submission', () => {
      useFundingStore.getState().actions.trackSubmission('bando-1', 'bozza', []);
      useFundingStore.getState().actions.trackSubmission('bando-2', 'bozza', []);
      useFundingStore.getState().actions.setBozzaTestuale('bando-1', 'TESTO');
      const sub2 = useFundingStore.getState().submissions.find((s) => s.bandoId === 'bando-2');
      expect(sub2?.bozzaTestuale).toBeUndefined();
    });
  });

  describe('refreshBandi()', () => {
    it('aggiorna lastBandiUpdate dopo refresh', async () => {
      await useFundingStore.getState().actions.refreshBandi();
      expect(useFundingStore.getState().lastBandiUpdate).not.toBeNull();
    });

    it('isLoading = false dopo refresh', async () => {
      await useFundingStore.getState().actions.refreshBandi();
      expect(useFundingStore.getState().isLoading).toBe(false);
    });
  });
});
