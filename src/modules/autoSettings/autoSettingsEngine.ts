/**
 * modules/autoSettings/autoSettingsEngine.ts
 *
 * Motore di auto-configurazione Jarvis (Feature: Auto-Settings Engine).
 *
 * Espone una funzione pura `computeAutoDeltas(ctx)` che analizza il profilo
 * comportamentale + la storia delle CognitiveEntry e propone modifiche ai
 * settings dell'app (tema, ai, automazione) calibrate sul comportamento reale
 * del docente.
 *
 * ATTENZIONE: nessun import di store o hook. Pure function, zero side-effects.
 * Il consumer (useAutoSettingsEngine) si occupa di applicare e persistere.
 */

import type { AppThemeState, TimetableSettings, AiSettings } from '../../types';
import type { CognitiveEntry, CognitiveDomain } from '../cognitiveLayer/types';
import type { UserBehaviorProfile } from '../../cognition/userBehaviorModel';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SettingsDeltaPayload {
  themeState?: Partial<AppThemeState>;
  settings?:   Partial<TimetableSettings>;
  aiSettings?: Partial<AiSettings>;
}

export interface AutoSettingsDelta {
  /** Stable ID (one per rule). Same rule → same ID every scan. */
  id:          string;
  label:       string;
  description: string;
  /** Data-driven explanation to show the user. */
  reason:      string;
  /** 0–1. ≥ 0.88 → auto-apply silently. */
  confidence:  number;
  category:    'theme' | 'ai' | 'automation' | 'general';
  /** Material Symbols icon name */
  icon:        string;
  payload:     SettingsDeltaPayload;
}

export interface AutoSettingsContext {
  entries:           CognitiveEntry[];
  profile:           UserBehaviorProfile;
  currentThemeState: AppThemeState;
  currentSettings:   TimetableSettings;
  currentAiSettings: AiSettings;
  hourOfDay:         number; // 0-23
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function countDomain(entries: CognitiveEntry[], domain: CognitiveDomain): number {
  return entries.filter(e => e.domain === domain).length;
}

function domainPercent(entries: CognitiveEntry[], domain: CognitiveDomain): number {
  if (entries.length === 0) return 0;
  return countDomain(entries, domain) / entries.length;
}

function isMorning(h: number): boolean {
  return h >= 7 && h <= 12;
}

function isEvening(h: number): boolean {
  return h >= 19 || h < 6;
}

// ─── Rules ────────────────────────────────────────────────────────────────────

function ruleComplianceMinimal(ctx: AutoSettingsContext): AutoSettingsDelta | null {
  const { entries, currentThemeState } = ctx;
  const compPct   = domainPercent(entries, 'compliance');
  const compCount = countDomain(entries, 'compliance');

  if (
    compPct >= 0.55 &&
    compCount >= 3 &&
    currentThemeState.visualStyle !== 'minimal'
  ) {
    const conf = Math.min(0.90, 0.76 + compPct * 0.02);
    return {
      id:          'aset_compliance_minimal',
      label:       'Stile Minimal',
      description: 'Riduce distrazioni visive nei task di compliance.',
      reason:      `Il ${Math.round(compPct * 100)}% delle attività recenti è di tipo compliance — un tema più neutro migliora la concentrazione.`,
      confidence:  conf,
      category:    'theme',
      icon:        'straighten',
      payload:     { themeState: { visualStyle: 'minimal' } },
    };
  }
  return null;
}

function ruleMorningFlow(ctx: AutoSettingsContext): AutoSettingsDelta | null {
  const { entries, currentThemeState, hourOfDay } = ctx;
  const pedCount = countDomain(entries, 'pedagogical');

  if (
    isMorning(hourOfDay) &&
    pedCount >= 2 &&
    currentThemeState.uiMode === 'classic'
  ) {
    return {
      id:          'aset_morning_flow',
      label:       'Modalità Flow',
      description: 'Layout semplificato per lezioni mattutine.',
      reason:      `Sono le ${hourOfDay}:00 e hai ${pedCount} contenuti pedagogici recenti — Flow riduce le interruzioni.`,
      confidence:  0.72,
      category:    'theme',
      icon:        'stream',
      payload:     { themeState: { uiMode: 'flow' } },
    };
  }
  return null;
}

function rulePedagogyAura(ctx: AutoSettingsContext): AutoSettingsDelta | null {
  const { entries, currentThemeState } = ctx;
  const pedPct   = domainPercent(entries, 'pedagogical');
  const pedCount = countDomain(entries, 'pedagogical');

  if (
    pedPct >= 0.65 &&
    pedCount >= 4 &&
    currentThemeState.visualStyle !== 'aura'
  ) {
    return {
      id:          'aset_pedagogy_aura',
      label:       'Stile Aura',
      description: 'Tema caldo ottimizzato per contenuti didattici intensi.',
      reason:      `Il ${Math.round(pedPct * 100)}% del tuo lavoro recente è pedagogico — Aura crea l'ambiente giusto.`,
      confidence:  0.68,
      category:    'theme',
      icon:        'auto_awesome',
      payload:     { themeState: { visualStyle: 'aura' } },
    };
  }
  return null;
}

function ruleEveningDark(ctx: AutoSettingsContext): AutoSettingsDelta | null {
  const { currentThemeState, hourOfDay } = ctx;

  if (isEvening(hourOfDay) && currentThemeState.mode === 'light') {
    return {
      id:          'aset_evening_dark',
      label:       'Tema Scuro',
      description: 'Riduce l\'affaticamento visivo nelle ore serali.',
      reason:      `Sono le ${hourOfDay < 6 ? hourOfDay + 24 : hourOfDay}:00 — il tema scuro riduce l'affaticamento degli occhi.`,
      confidence:  0.62,
      category:    'theme',
      icon:        'dark_mode',
      payload:     { themeState: { mode: 'dark' } },
    };
  }
  return null;
}

function ruleAutomationBoost(ctx: AutoSettingsContext): AutoSettingsDelta | null {
  const { profile } = ctx;

  if (
    profile.preferredActions.length >= 3 &&
    profile.riskTolerance === 'medium'
  ) {
    return {
      id:          'aset_automation_boost',
      label:       'Automazione Parziale',
      description: 'Jarvis può gestire le azioni più frequenti silenziosamente.',
      reason:      `Hai ${profile.preferredActions.length} azioni preferite consolidate — la tua tolleranza al rischio supporta un'automazione più proattiva.`,
      confidence:  0.66,
      category:    'automation',
      icon:        'bolt',
      payload:     {},
    };
  }
  return null;
}

// ─── Conflict resolution ──────────────────────────────────────────────────────

/**
 * Per i delta di tipo 'theme', mantiene solo quello con confidence più alta.
 * I delta non-theme passano tutti.
 */
function resolveConflicts(deltas: AutoSettingsDelta[]): AutoSettingsDelta[] {
  const themeDeltas  = deltas.filter(d => d.category === 'theme');
  const otherDeltas  = deltas.filter(d => d.category !== 'theme');

  if (themeDeltas.length === 0) return otherDeltas;

  const bestTheme = themeDeltas.reduce((best, d) =>
    d.confidence > best.confidence ? d : best,
  );

  return [bestTheme, ...otherDeltas];
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Calcola i delta di configurazione suggeriti per il contesto dato.
 *
 * Garantisce:
 * - Solo 1 delta per categoria 'theme' (il più confidenziale)
 * - Confidenze nell'intervallo [0.55, 0.95]
 * - Nessun delta proposto se il setting target è già quello corrente
 */
export function computeAutoDeltas(ctx: AutoSettingsContext): AutoSettingsDelta[] {
  const rules = [
    ruleComplianceMinimal,
    ruleMorningFlow,
    rulePedagogyAura,
    ruleEveningDark,
    ruleAutomationBoost,
  ];

  const candidates = rules
    .map(rule => rule(ctx))
    .filter((d): d is AutoSettingsDelta => d !== null);

  return resolveConflicts(candidates);
}
