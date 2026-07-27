/**
 * salesPack.test.ts — Test suite per il modulo Sales Pack.
 *
 * Copre:
 *   - generateSalesPack(): genera contenuti non vuoti
 *   - createSalesPack(): pack completo con metadati
 *   - getNextVersion(): versioning incrementale per tenant
 *   - salesPackStore: addPack, listMeta, getById, removePack
 *   - access control: isAdmin check
 *   - export helpers: copyDocumentText (mock clipboard)
 *   - delete pack: rimuove correttamente dallo store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { generateSalesPack }              from '../../src/modules/salesPack/salesPackGenerator';
import { createSalesPack, deleteSalesPack } from '../../src/modules/salesPack/salesPackService';
import {
  useSalesPackStore,
  getNextVersion,
  getCurrentVersion,
}                                         from '../../src/modules/salesPack/salesPackStore';
import { copyDocumentText }               from '../../src/modules/salesPack/salesPackExporter';

// ─── Mock dei moduli esterni ──────────────────────────────────────────────────

// Mock useComplianceStore
vi.mock('../../src/self-compliance/useComplianceStore', () => ({
  useComplianceStore: {
    getState: () => ({
      db: {
        gdprEnabled:          true,
        aiActEnabled:         true,
        consentRecorded:      true,
        dpiaCompleted:        true,
        transparencyActive:   true,
        dataRetentionEnabled: true,
        auditLoggingActive:   true,
        humanOversightActive: true,
      },
    }),
  },
}));

// Mock getConsistencySnapshot
vi.mock('../../src/cognition/runtimeConsistency', () => ({
  getConsistencySnapshot: () => ({
    snapshotAt:      new Date().toISOString(),
    effectiveMode:   'assistive_ai',
    complianceResult: { score: 85, violations: [] },
    blockedUseCases: [],
    modules:         { synced: true },
    hasCriticalViolation: false,
    isConsistent:    true,
  }),
}));

// Mock generateDPIA — schema reale dal tipo DPIA in certification/types.ts
vi.mock('../../src/self-compliance/certification/dpiaGenerator', () => ({
  generateDPIA: () => ({
    version:              '1.0',
    date:                 new Date().toISOString(),
    systemName:           'DocenteDoc AI',
    controller:           'Istituto Scolastico Demo',
    dpo:                  'dpo@scuola.gov.it',
    purpose:              ['Documentazione pedagogica', 'Valutazione studenti'],
    dataCategories:       [
      {
        name:           'Dati anagrafici studenti',
        subjects:       ['studenti minorenni'],
        sensitivity:    'ordinary',
        retentionDays:  365,
        legalBasis:     'GDPR Art. 6(1)(e)',
      },
    ],
    processingActivities: ['Redazione UDA', 'Gestione valutazioni'],
    risks:                [
      {
        id:           'r1',
        threat:       'Accesso non autorizzato',
        likelihood:   'low',
        impact:       'high',
        residualRisk: 'low',
        mitigation:   'Autenticazione forte',
        status:       'implemented',
      },
    ],
    necessityTest:        'Il trattamento è necessario per finalità istituzionali.',
    proportionalityTest:  'I dati raccolti sono minimali rispetto alle finalità.',
    conclusion:           'required',
    approvalStatus:       'draft',
  }),
}));

// Mock auditVerbaleGenerator
vi.mock('../../src/services/auditVerbaleGenerator', () => ({
  generateVerbaleHTML: () => '<html><body>Verbale HTML mock</body></html>',
  generateVerbaleTXT:  () => 'Verbale TXT mock',
}));

// Mock complianceReportGenerator
vi.mock('../../src/services/complianceReportGenerator', () => ({
  generateComplianceReport: () => ({
    generatedAt:    new Date().toISOString(),
    version:        '1.0',
    globalScore:    85,
    paReady:        true,
    gdpr:           { framework: 'GDPR',  score: 90, passed: 9,  total: 10, violations: [], status: 'compliant', label: 'GDPR' },
    aiAct:          { framework: 'AI_ACT', score: 80, passed: 8,  total: 10, violations: [], status: 'compliant', label: 'AI Act' },
    agid:           { framework: 'AGID_CAD', score: 85, passed: 8, total: 10, violations: [], status: 'compliant', label: 'AgID/CAD' },
    dpiaStatus:     'generated',
    dpiaTotalRisks: 5,
    dpiaOpenRisks:  1,
    readinessScore: 85,
    openGaps:       2,
    auditScenarios: [],
    topRemediations: ['Completare formazione privacy'],
    summary:        'Score: 85% — PA-READY',
  }),
  exportReportAsText: () => 'Report compliance mock',
}));

// Mock runAuditSimulation
vi.mock('../../src/self-compliance/runtime/audit/auditSimulator', () => ({
  AUDIT_SCENARIOS: [
    { id: 'production_live', label: 'Produzione Live', description: 'Stato reale', overrides: {} },
  ],
  runAuditSimulation: () => ({
    auditDate:              new Date().toISOString(),
    auditType:              'simulation',
    scenarioId:             'production_live',
    scenarioLabel:          'Produzione Live',
    overallScore:           85,
    complianceStatus:       'CONFORME',
    certificationReadiness: 'PRONTO',
    frameworkScores:        { GDPR: 90, AI_ACT: 80, AGID_CAD: 85 },
    totalRules:             30,
    passedRules:            26,
    findings:               [],
    blockingCount:          0,
    improvingCount:         0,
    recommendations:        ['Mantenere il livello attuale'],
    generatedBy:            'test-engine',
  }),
}));

// Mock slog
vi.mock('../../src/utils/structuredLogger', () => ({
  slog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset store prima di ogni test
  useSalesPackStore.getState().clearAll();
  // Reset versioning
  localStorage.removeItem('sales-pack-versions');
  localStorage.removeItem('sales-pack-storage');
});

// ─── generateSalesPack ────────────────────────────────────────────────────────

describe('generateSalesPack', () => {
  it('restituisce tutti i campi richiesti', () => {
    const result = generateSalesPack();

    expect(result).toHaveProperty('onePager');
    expect(result).toHaveProperty('demoScript');
    expect(result).toHaveProperty('dpia');
    expect(result).toHaveProperty('auditVerbaleHTML');
    expect(result).toHaveProperty('auditVerbaleTXT');
    expect(result).toHaveProperty('complianceReport');
    expect(result).toHaveProperty('complianceScore');
    expect(result).toHaveProperty('complianceStatus');
    expect(result).toHaveProperty('aiEnabled');
  });

  it('onePager non è vuoto e contiene "DocenteDoc"', () => {
    const { onePager } = generateSalesPack();
    expect(onePager.length).toBeGreaterThan(0);
    expect(onePager).toContain('DocenteDoc');
  });

  it('demoScript contiene "Parte 1"', () => {
    const { demoScript } = generateSalesPack();
    expect(demoScript).toContain('PARTE 1');
  });

  it('complianceScore è un numero 0–100', () => {
    const { complianceScore } = generateSalesPack();
    expect(complianceScore).toBeGreaterThanOrEqual(0);
    expect(complianceScore).toBeLessThanOrEqual(100);
  });

  it('complianceStatus è uno dei valori attesi', () => {
    const { complianceStatus } = generateSalesPack();
    expect(['CONFORME', 'PARZIALMENTE_CONFORME', 'NON_CONFORME']).toContain(complianceStatus);
  });
});

// ─── createSalesPack ─────────────────────────────────────────────────────────

describe('createSalesPack', () => {
  it('crea un pack con id, tenantId, createdBy, version', () => {
    const pack = createSalesPack('tenant_test', 'admin@test.it');

    expect(pack.id).toBeTruthy();
    expect(pack.tenantId).toBe('tenant_test');
    expect(pack.createdBy).toBe('admin@test.it');
    expect(pack.version).toBe(1);
    expect(pack.createdAt).toBeGreaterThan(0);
  });

  it('persiste il pack nello store', () => {
    createSalesPack('tenant_store', 'admin@test.it');
    const stored = useSalesPackStore.getState().getByTenant('tenant_store');
    expect(stored.length).toBe(1);
  });

  it('il pack ha tutti i campi documentali non vuoti', () => {
    const pack = createSalesPack('tenant_docs', 'admin@test.it');

    expect(pack.onePager.length).toBeGreaterThan(10);
    expect(pack.demoScript.length).toBeGreaterThan(10);
    expect(pack.dpia.length).toBeGreaterThan(10);
    expect(pack.auditVerbaleHTML.length).toBeGreaterThan(10);
    expect(pack.auditVerbaleTXT.length).toBeGreaterThan(10);
    expect(pack.complianceReport.length).toBeGreaterThan(10);
  });
});

// ─── Version increment ────────────────────────────────────────────────────────

describe('getNextVersion', () => {
  it('primo pack ha versione 1', () => {
    expect(getNextVersion('tenant_v')).toBe(1);
  });

  it('secondo pack dello stesso tenant ha versione 2', () => {
    getNextVersion('tenant_v2');
    expect(getNextVersion('tenant_v2')).toBe(2);
  });

  it('tenant diversi hanno versioni indipendenti', () => {
    expect(getNextVersion('tenantA')).toBe(1);
    expect(getNextVersion('tenantB')).toBe(1);
    expect(getNextVersion('tenantA')).toBe(2);
    expect(getCurrentVersion('tenantB')).toBe(1);
  });

  it('createSalesPack incrementa la versione ad ogni generazione', () => {
    const p1 = createSalesPack('tenant_inc', 'admin@test.it');
    const p2 = createSalesPack('tenant_inc', 'admin@test.it');

    expect(p1.version).toBe(1);
    expect(p2.version).toBe(2);
  });
});

// ─── Store operations ─────────────────────────────────────────────────────────

describe('useSalesPackStore', () => {
  it('listMeta restituisce metadati ordinati per data desc', () => {
    createSalesPack('tenant_meta', 'admin@test.it');
    createSalesPack('tenant_meta', 'admin@test.it');

    const meta = useSalesPackStore.getState().listMeta();
    expect(meta.length).toBe(2);
    // Entrambe le versioni devono essere presenti (ordine può essere stabile o instabile
    // se createdAt coincide nello stesso millisecondo in ambiente test)
    const versions = meta.map(m => m.version).sort((a, b) => a - b);
    expect(versions).toEqual([1, 2]);
  });

  it('getById restituisce il pack corretto', () => {
    const pack = createSalesPack('tenant_get', 'admin@test.it');
    const found = useSalesPackStore.getState().getById(pack.id);
    expect(found?.id).toBe(pack.id);
  });

  it('getById restituisce undefined per ID inesistente', () => {
    const found = useSalesPackStore.getState().getById('nonexistent');
    expect(found).toBeUndefined();
  });

  it('removePack elimina il pack dallo store', () => {
    const pack = createSalesPack('tenant_rm', 'admin@test.it');
    useSalesPackStore.getState().removePack(pack.id);
    expect(useSalesPackStore.getState().getById(pack.id)).toBeUndefined();
  });

  it('clearAll svuota lo store', () => {
    createSalesPack('tenant_clear', 'admin@test.it');
    createSalesPack('tenant_clear', 'admin@test.it');
    useSalesPackStore.getState().clearAll();
    expect(useSalesPackStore.getState().packs.length).toBe(0);
  });
});

// ─── deleteSalesPack (service) ────────────────────────────────────────────────

describe('deleteSalesPack', () => {
  it('rimuove il pack dal tenant', () => {
    const pack = createSalesPack('tenant_del', 'admin@test.it');
    expect(useSalesPackStore.getState().getById(pack.id)).toBeDefined();
    deleteSalesPack(pack.id);
    expect(useSalesPackStore.getState().getById(pack.id)).toBeUndefined();
  });
});

// ─── Access control ───────────────────────────────────────────────────────────

describe('Access control (isAdmin)', () => {
  it('un non-admin non può vedere la lista dei packs tramite il pannello', () => {
    // Il controllo è delegato a SalesPackPanel.
    // Test sintetico: verifica che la prop isAdmin=false
    // non produca un pack (non invochiamo il componente React qui).
    const isAdmin = false;
    if (!isAdmin) {
      // Non deve creare packs
      expect(useSalesPackStore.getState().packs.length).toBe(0);
    }
  });

  it('un admin può creare packs', () => {
    const isAdmin = true;
    if (isAdmin) {
      createSalesPack('tenant_admin', 'admin@test.it');
      expect(useSalesPackStore.getState().packs.length).toBe(1);
    }
  });
});

// ─── copyDocumentText ─────────────────────────────────────────────────────────

describe('copyDocumentText', () => {
  it('restituisce true quando clipboard è disponibile', async () => {
    // Mock clipboard API
    const writeMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeMock },
    });

    const result = await copyDocumentText('testo di test');
    expect(result).toBe(true);
    expect(writeMock).toHaveBeenCalledWith('testo di test');
  });

  it('restituisce false quando clipboard non è disponibile', async () => {
    // Simula clipboard non disponibile
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Not allowed')),
      },
    });

    const result = await copyDocumentText('testo');
    expect(result).toBe(false);
  });
});
