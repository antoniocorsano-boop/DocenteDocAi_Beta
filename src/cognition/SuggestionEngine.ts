﻿/**
 * SuggestionEngine — genera CopilotSuggestion contestuali basati sul TeacherModel,
 * InteractionMode corrente e AI Maturity score.
 *
 * Regole (v3 — DecisionContract):
 *  - Max 3 suggerimenti attivi (DecisionContract.MAX_SUGGESTIONS)
 *  - Prioritizzazione deterministica: priority → recency → relevance
 *  - Deduplicazione: skip se actionKey già in completedActions
 *  - Cooldown per actionKey (DecisionContract.COOLDOWN_MS = 6h)
 *  - Personalizzazione: ignored > soglia → deprioritizza
 *  - Artistico: solo praticante/maestro + contesto didattico attivo
 *  - Ogni suggerimento ha reason (trasparenza) e source (tracciabilità)
 *  - Fail-safe: suggerimento statico se tutto viene filtrato
 *  - DecisionContract.applyContract() finale prima di restituire
 */

import type { TeacherModel, CopilotSuggestion, JourneyLevel, SuggestionSource } from '../types/teacherModel.types';
import type { InteractionMode } from '../types/aiMaturita.types';
import { toJourneyLevel } from './CapabilityEngine';
import { generateArtisticSuggestions } from '../services/ArtisticConsilium';
import type { ArtisticSuggestion } from '../services/ArtisticConsilium';
import { DecisionContract, applyContract } from './decisionContract';

export interface SuggestionContext {
  model: TeacherModel;
  interactionMode: InteractionMode;
  aiMaturitaScore: number;
  /** True when teacher is in personal mode (no class assigned yet) */
  isPersonalMode?: boolean;
  /** True when a didactic context (UDA/lesson) is active — enables artistic */
  hasActiveDidacticContext?: boolean;
}

// ── Tipo interno catalogo ─────────────────────────────────────────────────────

interface CatalogueSuggestion extends CopilotSuggestion {
  minLevel: JourneyLevel;
  minAiScore?: number;
  personalModeOnly?: boolean;
  requiresBookLinked?: boolean;
}

/** Catalogo statico dei suggerimenti (id stabile per tracking) */
const CATALOGUE: CatalogueSuggestion[] = [
  // ── esploratore ───────────────────────────────────────────────────────
  {
    id: 'sug-lesson-streak',
    actionKey: 'classroom.attendance',
    type: 'feature',
    minLevel: 'esploratore',
    priority: 60,
    source: 'copilot',
    message: 'Hai creato le prime lezioni! Prova a registrare anche le presenze per sbloccare gli insight.',
    reason: 'Hai creato lezioni ma non ancora registrato presenze — è il passo naturale successivo.',
    targetView: 'classroom',
    icon: 'school',
  },
  {
    id: 'sug-try-copilot',
    actionKey: 'copilot.open',
    type: 'feature',
    minLevel: 'esploratore',
    priority: 55,
    source: 'copilot',
    message: 'Il Copilot Docente può generare valutazioni personalizzate. Prova a usarlo nella tab AI.',
    reason: 'Non hai ancora usato il Copilot — è una delle funzionalità chiave.',
    targetView: 'copilot',
    icon: 'smart_toy',
  },
  {
    id: 'sug-add-first-class',
    actionKey: 'classroom.add_class',
    type: 'workflow',
    minLevel: 'esploratore',
    priority: 70,
    source: 'copilot',
    message: 'Aggiungi la prima classe per sbloccare il registro presenze, le valutazioni e gli insight sugli studenti.',
    reason: 'Non hai ancora configurato una classe — molte funzionalità richiedono questo passaggio.',
    targetView: 'classroom',
    icon: 'group_add',
  },
  {
    id: 'sug-personal-mode-start',
    actionKey: 'planning.create_uda',
    type: 'feature',
    minLevel: 'esploratore',
    personalModeOnly: true,
    priority: 65,
    source: 'copilot',
    message: 'Stai lavorando in modalità personale. Crea una UDA o carica risorse nella Knowledge Base — senza bisogno di studenti.',
    reason: 'Sei in modalità personale: puoi comunque pianificare UDA e caricare materiali.',
    targetView: 'planning',
    icon: 'person',
  },
  {
    id: 'sug-book-integration-uda',
    actionKey: 'planning.integrate_book',
    type: 'workflow',
    minLevel: 'esploratore',
    requiresBookLinked: true,
    priority: 68,
    source: 'pattern',
    message: 'Hai collegato un servizio libro. Integra le risorse digitali direttamente nelle tue UDA!',
    reason: 'Hai appena collegato un servizio libro — il passo naturale è integrarlo nelle UDA.',
    targetView: 'planning',
    icon: 'auto_stories',
  },
  // ── praticante ────────────────────────────────────────────────────────
  {
    id: 'sug-drive-backup',
    actionKey: 'settings.drive_backup',
    type: 'workflow',
    minLevel: 'praticante',
    priority: 75,
    source: 'copilot',
    message: 'I tuoi dati crescono: attiva il backup su Google Drive nelle impostazioni.',
    reason: 'Hai accumulato molti dati. Un backup automatico su Drive protegge il tuo lavoro.',
    targetView: 'settings',
    icon: 'cloud_sync',
  },
  {
    id: 'sug-mode-semi-osmotica',
    actionKey: 'settings.mode_semi_osmotica',
    type: 'automation',
    minLevel: 'praticante',
    priority: 80,
    source: 'copilot',
    message: "Sei pronto per la modalità Semi-osmotica: il Copilot anticipa le tue azioni. Attivala nelle impostazioni AI.",
    reason: "Il tuo livello di utilizzo suggerisce che sei pronto per la modalità Semi-osmotica.",
    targetView: 'settings',
    icon: 'tune',
  },
  {
    id: 'sug-uda-planning',
    actionKey: 'planning.annual_plan',
    type: 'workflow',
    minLevel: 'praticante',
    priority: 72,
    source: 'pattern',
    message: 'Hai completato più UDA! Usa la Pianificazione Annuale per collegare tutto in un percorso.',
    reason: 'Hai creato più UDA — la Pianificazione Annuale le unisce in un percorso coerente.',
    targetView: 'planning',
    icon: 'calendar_month',
  },
  {
    id: 'sug-analytics-insights',
    actionKey: 'copilot.analytics',
    type: 'feature',
    minLevel: 'praticante',
    minAiScore: 40,
    priority: 78,
    source: 'copilot',
    message: 'Il tuo punteggio AI è alto: esplora la dashboard Analytics per insight predittivi sugli studenti.',
    reason: 'Il tuo punteggio AI è sopra 40 — la dashboard Analytics sblocca insight predittivi.',
    targetView: 'copilot',
    icon: 'insights',
  },
  {
    id: 'sug-artistic-consilium',
    actionKey: 'copilot.artistic_open',
    type: 'feature',
    minLevel: 'praticante',
    priority: 65,
    source: 'artistic',
    message: "Il Consilium Artistico suggerisce attività creative e interdisciplinari per le tue UDA. Prova l'AI Artistica!",
    reason: "Hai raggiunto il livello praticante — il Consilium Artistico è ora disponibile per arricchire le tue UDA.",
    targetView: 'copilot',
    icon: 'palette',
  },
  // ── maestro ───────────────────────────────────────────────────────────
  {
    id: 'sug-automation-full',
    actionKey: 'copilot.automation_full',
    type: 'automation',
    minLevel: 'maestro',
    priority: 90,
    source: 'copilot',
    message: "Sei un Maestro: abilita le automazioni complete e lascia che il Copilot lavori in background.",
    reason: "Il tuo profilo di utilizzo avanzato permette di abilitare le automazioni complete.",
    targetView: 'copilot',
    icon: 'auto_awesome',
  },
  {
    id: 'sug-mode-osmotica',
    actionKey: 'settings.mode_osmotica',
    type: 'automation',
    minLevel: 'maestro',
    minAiScore: 60,
    priority: 95,
    source: 'copilot',
    message: "Sei pronto per la modalità Osmotica: il Copilot gestisce tutto in autonomia. Attivala.",
    reason: "Il tuo punteggio AI e livello di esperienza ti qualificano per la modalità Osmotica.",
    targetView: 'settings',
    icon: 'psychology',
  },
];

// ── Suggerimento fail-safe ────────────────────────────────────────────────────

const FALLBACK_SUGGESTION: CopilotSuggestion = {
  id: 'sug-fallback',
  actionKey: 'planning.create_uda',
  type: 'workflow',
  priority: DecisionContract.FALLBACK_PRIORITY,
  source: 'copilot',
  message: 'Inizia creando una UDA per organizzare la tua didattica.',
  reason: 'È sempre un buon momento per pianificare una nuova Unità di Apprendimento.',
  targetView: 'planning',
  icon: 'add_circle',
};

// ── Logica interna ────────────────────────────────────────────────────────────

function isOnCooldown(sug: CatalogueSuggestion, model: TeacherModel): boolean {
  if (model.dismissedHints.includes(sug.id) || model.dismissedHints.includes(sug.actionKey)) {
    return true;
  }
  const lastShown = model.suggestionCooldown?.[sug.actionKey];
  if (lastShown !== undefined && Date.now() - lastShown < DecisionContract.COOLDOWN_MS) {
    return true;
  }
  return false;
}

function isAlreadyCompleted(sug: CatalogueSuggestion, model: TeacherModel): boolean {
  return model.completedActions?.includes(sug.actionKey) ?? false;
}

function effectivePriority(sug: CatalogueSuggestion, model: TeacherModel): number {
  const ignoreCount = model.ignoredSuggestions?.[sug.actionKey] ?? 0;
  return sug.priority - ignoreCount * 10;
}

function sortSuggestions(
  candidates: CatalogueSuggestion[],
  model: TeacherModel,
): CatalogueSuggestion[] {
  const sourceOrder: Record<SuggestionSource, number> = {
    pattern: 3,
    copilot: 2,
    artistic: 1,
  };

  return [...candidates].sort((a, b) => {
    const pa = effectivePriority(a, model);
    const pb = effectivePriority(b, model);
    if (pa !== pb) return pb - pa;

    const aShown = (model.suggestionCooldown?.[a.actionKey] ?? 0) > 0;
    const bShown = (model.suggestionCooldown?.[b.actionKey] ?? 0) > 0;
    if (aShown !== bShown) return aShown ? 1 : -1;

    return (sourceOrder[b.source] ?? 0) - (sourceOrder[a.source] ?? 0);
  });
}

// ── API pubblica ──────────────────────────────────────────────────────────────

/**
 * Genera la lista di suggerimenti contestuali per il docente.
 *
 * Pipeline:
 *  1. Filtra per livello, aiScore, cooldown, completedActions, personalMode, bookLinked
 *  2. InteractionMode boost
 *  3. Ordinamento deterministico (priority → recency → relevance)
 *  4. DecisionContract.applyContract() → max 3, solo conformi
 *  5. Fail-safe: se vuoto, restituisce FALLBACK_SUGGESTION
 */
export function generateNextActions(ctx: SuggestionContext): CopilotSuggestion[] {
  const { model, interactionMode, aiMaturitaScore, isPersonalMode } = ctx;
  const journeyLevel = toJourneyLevel(model.capabilityLevel);

  const levelOrder: JourneyLevel[] = ['esploratore', 'praticante', 'maestro'];
  const currentIdx = levelOrder.indexOf(journeyLevel);

  const candidates = CATALOGUE.filter((sug) => {
    const sugIdx = levelOrder.indexOf(sug.minLevel);
    if (sugIdx > currentIdx) return false;
    if (sug.minAiScore !== undefined && aiMaturitaScore < sug.minAiScore) return false;
    if (isOnCooldown(sug, model)) return false;
    if (isAlreadyCompleted(sug, model)) return false;
    if (sug.personalModeOnly && !isPersonalMode) return false;
    if (sug.requiresBookLinked && !(model.usageProfile.bookServicesLinked ?? 0)) return false;
    if (sug.source === 'artistic' && model.preferences?.acceptsArtisticSuggestions === false) {
      return false;
    }
    // User preference: suggestion category toggles
    const prefs = model.preferences;
    if (
      prefs?.acceptsClassManagementSuggestions === false &&
      ['sug-lesson-streak', 'sug-add-first-class'].includes(sug.id)
    ) return false;
    if (
      prefs?.acceptsLessonDesignSuggestions === false &&
      ['sug-personal-mode-start', 'sug-uda-planning', 'sug-book-integration-uda'].includes(sug.id)
    ) return false;
    if (prefs?.acceptsBookIntegrationSuggestions === false && sug.requiresBookLinked) return false;
    return true;
  });

  const boosted = [...candidates];
  if (journeyLevel === 'praticante' && interactionMode === 'classica') {
    const modeIdx = boosted.findIndex((s) => s.id === 'sug-mode-semi-osmotica');
    if (modeIdx > 0) {
      const [item] = boosted.splice(modeIdx, 1);
      boosted.unshift(item);
    }
  }
  if (journeyLevel === 'maestro' && interactionMode !== 'osmotica') {
    const modeIdx = boosted.findIndex((s) => s.id === 'sug-mode-osmotica');
    if (modeIdx > 0) {
      const [item] = boosted.splice(modeIdx, 1);
      boosted.unshift(item);
    }
  }

  const sorted = sortSuggestions(boosted, model);
  const contracted = applyContract(sorted);

  if (contracted.length === 0) {
    return [FALLBACK_SUGGESTION];
  }

  return contracted;
}

/**
 * Returns the single highest-priority next action for the current context.
 * This is the recommended "one primary CTA" for the NextStepBanner.
 *
 * Always returns a suggestion (falls back to FALLBACK_SUGGESTION).
 */
export function getPrimaryNextAction(ctx: SuggestionContext): CopilotSuggestion {
  const actions = generateNextActions(ctx);
  return actions[0] ?? FALLBACK_SUGGESTION;
}

// ── Async enrichment with AI-generated artistic suggestions ──────────────────────

function activityTypeToIcon(type: ArtisticSuggestion['activityType']): string {
  const map: Record<ArtisticSuggestion['activityType'], string> = {
    visual: 'palette',
    musical: 'music_note',
    theatrical: 'theater_comedy',
    literary: 'menu_book',
    interdisciplinary: 'auto_awesome',
  };
  return map[type] ?? 'palette';
}

/**
 * Async: chiama il Consilium Artistico e restituisce suggerimenti in formato TCM.
 *
 * Regole integrazione (DecisionContract):
 *  - Solo praticante o maestro (capabilityLevel ≥ 2)
 *  - Solo se hasActiveDidacticContext = true (UDA/lesson attiva)
 *  - Solo se il docente accetta suggerimenti artistici
 *  - Fallback silenzioso su errore AI
 *
 * Ogni suggerimento prodotto ha actionKey, reason e source='artistic'.
 */
export async function generateArtisticNextActions(
  ctx: SuggestionContext,
): Promise<CopilotSuggestion[]> {
  const journeyLevel = toJourneyLevel(ctx.model.capabilityLevel);
  // Gate 1: livello minimo
  if (ctx.model.capabilityLevel < DecisionContract.ARTISTIC_MIN_CAPABILITY_LEVEL) return [];
  // Gate 2: contesto didattico attivo (non entrare senza una UDA/lezione)
  if (!ctx.hasActiveDidacticContext) return [];
  // Gate 3: preferenze docente
  if (ctx.model.preferences?.acceptsArtisticSuggestions === false) return [];

  const context = {
    gradeLevel: journeyLevel === 'maestro' ? 'scuola secondaria superiore' : 'scuola secondaria',
    learningObjectives:
      ctx.aiMaturitaScore >= 60
        ? ['interdisciplinarità', 'competenze trasversali', 'creatività']
        : ['arricchimento didattico'],
  };

  const suggestions = await generateArtisticSuggestions(context).catch(() => []);
  return suggestions.map((s) => ({
    id: `sug-artistic.ai.${s.id}`,
    actionKey: `artistic.activity.${s.id}`,
    type: 'feature' as const,
    source: 'artistic' as const,
    priority: 60,
    message: `${s.title} (${s.estimatedMinutes} min) — ${s.description.slice(0, 80)}`,
    reason: `Il Consilium Artistico ha generato questa attività in base al contesto didattico corrente.`,
    targetView: 'copilot',
    icon: activityTypeToIcon(s.activityType),
  }));
}
