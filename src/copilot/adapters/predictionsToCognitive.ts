/**
 * copilot/adapters/predictionsToCognitive.ts
 *
 * Adatta il sistema legacy CopilotPredictions (actionKey format) al
 * Cognitive Layer Orbit (ctaType format).
 *
 * Utilizzo in CopilotProvider: quando CopilotPredictions produce suggestions,
 * le mappabili vengono ingestate come system_event nel Cognitive Layer
 * (compaiono in JarvisIndicator) invece di essere renderizzate nella chip bar.
 * Le suggestions senza mapping rimangono nella chip bar classica.
 *
 * CopilotActions handlers (navigate/toast) restano invariati: il trigger
 * cambia (ThumbMenu vs chip bar), ma il comportamento è identico.
 */

import type { CopilotSuggestion } from '../CopilotPredictions';

// ─── Mapping table ────────────────────────────────────────────────────────────

/**
 * Mappa actionKey (legacy) → ctaType Orbit.
 * I ctaType devono corrispondere a quelli registrati in defaultSkills.ts.
 */
const ACTION_KEY_TO_CTA_TYPE: Record<string, string> = {
  'assessment.generate':         'MANAGE_LESSON',
  'notes.create':                'MANAGE_LESSON',
  'uda.schedule_lessons':        'MANAGE_LESSON',
  'student.explain_risk':        'SCHEDULE_RECOVERY',
  'student.intervention_plan':   'SCHEDULE_RECOVERY',
  'evaluation.generate_feedback': 'MANAGE_LESSON',
};

// ─── Types ────────────────────────────────────────────────────────────────────

/** Parametri pronti per ingestInput() nel Cognitive Layer */
export interface PredictionIngestParams {
  tenantId:  string;
  sourceId:  string;
  content:   string;
  label:     string;
  /** ctaType derivato — incluso in meta così il handler può leggerlo */
  meta:      Record<string, unknown>;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * Mappa una CopilotSuggestion ai parametri di ingestInput.
 * Restituisce null se l'actionKey non ha un mapping Orbit (candidato chip bar).
 *
 * Il content viene arricchito con keyword pedagogiche per garantire che
 * classifyInput() assegni il dominio corretto.
 */
export function mapCopilotSuggestionToIngest(
  suggestion: CopilotSuggestion,
  tenantId: string,
): PredictionIngestParams | null {
  const ctaType = ACTION_KEY_TO_CTA_TYPE[suggestion.actionKey];
  if (!ctaType) return null;

  // Parole chiave pedagogiche garantiscono classificazione stabile
  const pedagogicalHint = 'Attività didattica per la classe e la lezione.';
  const content = [
    suggestion.description ?? suggestion.label,
    pedagogicalHint,
  ].join(' ');

  return {
    tenantId,
    sourceId: `copilot-${suggestion.id}`,
    content,
    label:    suggestion.label,
    meta: {
      ctaType,
      actionKey:     suggestion.actionKey,
      actionPayload: suggestion.actionPayload ?? {},
    },
  };
}

/** True se la suggestion ha un mapping Orbit. */
export function isMappedToOrbit(suggestion: CopilotSuggestion): boolean {
  return suggestion.actionKey in ACTION_KEY_TO_CTA_TYPE;
}
