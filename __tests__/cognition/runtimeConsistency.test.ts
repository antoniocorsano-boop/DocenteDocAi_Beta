/**
 * runtimeConsistency.test.ts — C21: Unit tests per il Consistency Engine.
 *
 * Copre:
 *   - AI_REQUIRED_USE_CASES membership
 *   - getBlockedUseCases(): offline_only → 7 UC bloccati; assistive_ai → 0
 *   - isUseCaseBlocked(): UC in set bloccato vs UC fuori dal set
 *   - syncModules(): ritorna ModuleSyncReport strutturalmente corretto
 *   - smartReset(): ritorna true senza eccezioni
 *   - checkConsistency(): ritorna ConsistencyReport con campi richiesti
 *   - getBlockReasonLabel(): ritorna stringa non vuota per UC bloccato
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  AI_REQUIRED_USE_CASES,
  getBlockedUseCases,
  isUseCaseBlocked,
  syncModules,
  smartReset,
  checkConsistency,
  getBlockReasonLabel,
} from '../../src/cognition/runtimeConsistency';
import type { UserSovereigntyConfig } from '../../src/types/sovereignty.types';
import { useSovereigntyStore } from '../../src/stores/useSovereigntyStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OFFLINE_CONFIG: UserSovereigntyConfig = {
  mode:      'offline_only',
  aiEnabled: false,
  dataSharing: { telemetry: false, audit: false, openData: false },
  personalization: { localOnly: true, adaptiveLearning: false },
  lastConsentUpdate: '',
};

const ASSISTIVE_CONFIG: UserSovereigntyConfig = {
  mode:      'assistive_ai',
  aiEnabled: true,
  dataSharing: { telemetry: false, audit: true, openData: false },
  personalization: { localOnly: true, adaptiveLearning: false },
  lastConsentUpdate: new Date().toISOString(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AI_REQUIRED_USE_CASES', () => {
  it('contiene esattamente 7 UC AI-dipendenti', () => {
    expect(AI_REQUIRED_USE_CASES.size).toBe(7);
  });

  it('include UC-P1, UC-E2, UC-E3, UC-V2, UC-R1, UC-R4, UC-R5', () => {
    const expected = ['UC-P1', 'UC-E2', 'UC-E3', 'UC-V2', 'UC-R1', 'UC-R4', 'UC-R5'];
    for (const uc of expected) {
      expect(AI_REQUIRED_USE_CASES.has(uc as never)).toBe(true);
    }
  });

  it('non include UC-P2 (non AI-dipendente)', () => {
    expect(AI_REQUIRED_USE_CASES.has('UC-P2' as never)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getBlockedUseCases', () => {
  it('restituisce 7 UC bloccati quando aiEnabled=false (modalità offline_only)', () => {
    const blocked = getBlockedUseCases(OFFLINE_CONFIG);
    expect(blocked).toHaveLength(7);
    expect(blocked.every((b) => AI_REQUIRED_USE_CASES.has(b.useCaseId))).toBe(true);
  });

  it('restituisce array vuoto in modalità assistive_ai', () => {
    const blocked = getBlockedUseCases(ASSISTIVE_CONFIG);
    expect(blocked).toHaveLength(0);
  });

  it('ogni BlockedUseCase ha useCaseId e reason non vuoti', () => {
    const blocked = getBlockedUseCases(OFFLINE_CONFIG);
    for (const b of blocked) {
      expect(b.useCaseId).toBeTruthy();
      expect(b.reason).toBeTruthy();
    }
  });

  it('usa la configurazione dallo store se non viene passata', () => {
    // Default store è assistive_ai → nessun blocco
    const blocked = getBlockedUseCases();
    expect(Array.isArray(blocked)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('isUseCaseBlocked', () => {
  it('UC-P1 è bloccato in offline_only', () => {
    expect(isUseCaseBlocked('UC-P1', OFFLINE_CONFIG)).toBe(true);
  });

  it('UC-E2 è bloccato in offline_only', () => {
    expect(isUseCaseBlocked('UC-E2', OFFLINE_CONFIG)).toBe(true);
  });

  it('UC-P2 NON è bloccato anche in offline_only (non è AI-dipendente)', () => {
    expect(isUseCaseBlocked('UC-P2' as never, OFFLINE_CONFIG)).toBe(false);
  });

  it('UC-P1 NON è bloccato in assistive_ai', () => {
    expect(isUseCaseBlocked('UC-P1', ASSISTIVE_CONFIG)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('syncModules', () => {
  it('ritorna un ModuleSyncReport strutturalmente corretto', () => {
    const report = syncModules();
    expect(report).toBeDefined();
    expect(typeof report.degradingCount).toBe('number');
    expect(Array.isArray(report.adaptiveProfiles)).toBe(true);
    expect(Array.isArray(report.hotspots)).toBe(true);
    expect(typeof report.cumulativeComplianceDelta).toBe('number');
    expect(typeof report.summaryCount).toBe('number');
  });

  it('degradingCount è un intero non negativo', () => {
    const report = syncModules();
    expect(report.degradingCount).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('smartReset', () => {
  it('ritorna true senza lanciare eccezioni', () => {
    expect(() => {
      const result = smartReset();
      expect(result).toBe(true);
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('checkConsistency', () => {
  it('ritorna un ConsistencyReport con tutti i campi richiesti', () => {
    const report = checkConsistency();
    expect(report).toBeDefined();
    expect(report.state).toBeDefined();
    expect(Array.isArray(report.issues)).toBe(true);
    expect(Array.isArray(report.remediation)).toBe(true);
  });

  it('se issues non è vuoto, remediation ha almeno un elemento', () => {
    const report = checkConsistency();
    if (report.issues.length > 0) {
      expect(report.remediation.length).toBeGreaterThan(0);
    }
  });

  it('state.snapshotAt è un ISO timestamp valido', () => {
    const report = checkConsistency();
    expect(new Date(report.state.snapshotAt).toISOString()).toBe(report.state.snapshotAt);
  });

  it('state.blockedUseCases è un array (potrebbe essere vuoto in default config)', () => {
    const report = checkConsistency();
    expect(Array.isArray(report.state.blockedUseCases)).toBe(true);
  });

  it('stato default senza lastConsentUpdate include issue "sovranità"', () => {
    // Reset store to default (no lastConsentUpdate)
    useSovereigntyStore.setState({
      config: {
        mode: 'assistive_ai',
        aiEnabled: true,
        dataSharing: { telemetry: false, audit: true, openData: false },
        personalization: { localOnly: true, adaptiveLearning: false },
        lastConsentUpdate: '',
      },
    });
    const report = checkConsistency();
    expect(report.issues.some((i) => i.toLowerCase().includes('sovranità'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('getBlockReasonLabel', () => {
  beforeEach(() => {
    // Set offline mode so there are blocked UCs
    useSovereigntyStore.setState({
      config: OFFLINE_CONFIG,
    });
  });

  it('ritorna stringa non vuota per UC-P1 in offline_only', () => {
    // Nota: getBlockReasonLabel usa la configurazione dallo store corrente
    const label = getBlockReasonLabel('UC-P1');
    expect(typeof label).toBe('string');
    // When offline, reason should be non-empty
    expect(label.length).toBeGreaterThan(0);
  });

  it('ritorna stringa vuota per UC non bloccato (UC-P2)', () => {
    // UC-P2 is not in AI_REQUIRED set → never blocked
    const label = getBlockReasonLabel('UC-P2' as never);
    expect(label).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ConsistencyReport.state shape', () => {
  it('hasCriticalViolation è boolean', () => {
    const { state } = checkConsistency();
    expect(typeof state.hasCriticalViolation).toBe('boolean');
  });

  it('isConsistent è boolean', () => {
    const { state } = checkConsistency();
    expect(typeof state.isConsistent).toBe('boolean');
  });

  it('complianceResult.liveScore è numero tra 0 e 100', () => {
    const { state } = checkConsistency();
    expect(state.complianceResult.liveScore).toBeGreaterThanOrEqual(0);
    expect(state.complianceResult.liveScore).toBeLessThanOrEqual(100);
  });
});
