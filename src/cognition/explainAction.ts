/**
 * explainAction.ts — Sprint 15: Explainability Layer.
 *
 * Pure function that translates a RankedAction (with its scoreBreakdown) into
 * an ActionExplanation readable by teachers and enterprise auditors.
 *
 * Enterprise-ready + conforme normativa scuola:
 *   - Risponde a "Perché ti sto suggerendo questo?"
 *   - Confidence derivata da finalScore normalizzato 0–1 (÷ 200)
 *   - dataUsed elenca le fonti dati effettivamente consultate
 *   - normativeRef inclusa ove rilevante (GDPR/AgID)
 *
 * Exported types:
 *   - ActionExplanation           — human-readable AI transparency object
 *
 * Exported functions:
 *   - explainAction(action)       — RankedAction → ActionExplanation
 */

import type { RankedAction, ScoreBreakdown } from './rankingEngine';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ActionExplanation {
  /** ID of the source RankedAction. */
  actionId:      string;
  /** One-line explanatory headline shown above reasons. */
  headline:      string;
  /** Ordered list of human-readable factors (most influential first). */
  reasons:       string[];
  /** Data sources the engine consulted to produce this recommendation. */
  dataUsed:      string[];
  /** Confidence score normalised to 0–1 (finalScore ÷ 200). */
  confidence:    number;
  /** Normative reference when compliance is a driving factor. */
  normativeRef?: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildHeadline(action: RankedAction, breakdown: ScoreBreakdown): string {
  if (breakdown.complianceWeight > 0) {
    return `Conformità normativa richiede attenzione — ${action.title}`;
  }
  if (breakdown.urgency >= 25) {
    return `Segnale critico attivo — ${action.title}`;
  }
  if (breakdown.urgency >= 10) {
    return `Segnale di attenzione rilevato — ${action.title}`;
  }
  if (breakdown.userAffinity > 0) {
    return `Azione frequentemente usata — ${action.title}`;
  }
  const PRIORITY_LABELS: Record<string, string> = {
    high:   'Alta priorità',
    medium: 'Priorità media',
    low:    'Attività suggerita',
  };
  return `${PRIORITY_LABELS[action.priority] ?? 'Suggerimento'} — ${action.title}`;
}

function buildReasons(action: RankedAction, breakdown: ScoreBreakdown): string[] {
  const reasons: Array<{ score: number; text: string }> = [];

  // Base priority
  if (breakdown.basePriority >= 80) {
    reasons.push({ score: breakdown.basePriority, text: 'Classificata come priorità alta dal motore decisionale' });
  } else if (breakdown.basePriority >= 40) {
    reasons.push({ score: breakdown.basePriority, text: 'Classificata come priorità media dal motore decisionale' });
  } else {
    reasons.push({ score: breakdown.basePriority, text: 'Priorità base nel piano suggerimenti' });
  }

  // Urgency
  if (breakdown.urgency >= 25) {
    reasons.push({ score: breakdown.urgency, text: 'Segnale critico attivo nel sistema — intervento urgente' });
  } else if (breakdown.urgency >= 10) {
    reasons.push({ score: breakdown.urgency, text: 'Segnale di attenzione rilevato in un\'area correlata' });
  } else if (breakdown.urgency > 0) {
    reasons.push({ score: breakdown.urgency, text: 'Segnale informativo associato a questa azione' });
  }

  // Compliance
  if (breakdown.complianceWeight > 0) {
    reasons.push({ score: breakdown.complianceWeight, text: 'Stato di conformità GDPR/AgID richiede attenzione immediata' });
  }

  // User affinity
  if (breakdown.userAffinity > 0) {
    reasons.push({ score: breakdown.userAffinity, text: 'Eseguita frequentemente dall\'utente — azione preferita rilevata' });
  } else if (breakdown.userAffinity < 0) {
    reasons.push({ score: Math.abs(breakdown.userAffinity), text: 'Nota: azione spesso ignorata in passato — verifica la sua utilità' });
  }

  // Recency
  if (breakdown.recencyBoost > 0) {
    reasons.push({ score: breakdown.recencyBoost, text: 'Non eseguita nelle ultime 24 ore — contesto aggiornato' });
  }

  // Approval required
  if (action.requiresApproval) {
    reasons.push({ score: 0, text: 'Richiede approvazione dirigente (HITL) prima dell\'esecuzione' });
  }

  // Sort by weight descending (most influential first), drop zero-score last
  return reasons
    .sort((a, b) => b.score - a.score)
    .map(({ text }) => text);
}

/** Map action type string → human-readable data source labels */
const TYPE_DATA_MAP: Record<string, string[]> = {
  enterprise:    ['stato compliance GDPR/AgID', 'storico approvazioni', 'registro attività'],
  hitl:          ['storico approvazioni', 'registro attività'],
  classroom:     ['registro studenti', 'valutazioni', 'presenze'],
  student:       ['registro studenti', 'profilo studente', 'progressi didattici'],
  uda:           ['pianificazione UDA', 'progressi didattici', 'obiettivi curriculari'],
  planning:      ['pianificazione annuale', 'calendario didattico'],
  documents:     ['documenti caricati', 'stato archiviazione'],
  analytics:     ['dati analitici', 'statistiche utilizzo'],
  drive:         ['Google Drive', 'backup documenti'],
};

function buildDataUsed(action: RankedAction, breakdown: ScoreBreakdown): string[] {
  const sources = new Set<string>();

  // Always consulted: teacher model + system state
  sources.add('profilo utente docente');
  sources.add('stato sistema Copilot');

  // Per action type
  const typeKey = Object.keys(TYPE_DATA_MAP).find(
    (k) => action.type === k || action.type.startsWith(k),
  );
  if (typeKey) {
    TYPE_DATA_MAP[typeKey].forEach((s) => sources.add(s));
  } else {
    sources.add('storico attività recenti');
  }

  // Urgency: active signals consulted
  if (breakdown.urgency > 0) {
    sources.add('segnali sistema attivi');
  }

  // Compliance: compliance state consulted
  if (breakdown.complianceWeight > 0) {
    sources.add('stato compliance GDPR/AgID');
  }

  // User affinity: behavior profile consulted
  if (breakdown.userAffinity !== 0) {
    sources.add('profilo comportamentale utente');
    sources.add('storico accettazioni/rifiuti');
  }

  // Recency: audit log consulted
  if (breakdown.recencyBoost > 0) {
    sources.add('log esecuzioni ultime 24h');
  }

  return Array.from(sources);
}

function buildNormativeRef(action: RankedAction, breakdown: ScoreBreakdown): string | undefined {
  if (breakdown.complianceWeight <= 0) return undefined;
  if (action.type === 'enterprise' || action.requiresApproval) {
    return 'Reg. UE 2016/679 (GDPR) art. 5 — Principi relativi al trattamento dei dati';
  }
  return undefined;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a full transparency explanation for a ranked CopilotBrain suggestion.
 *
 * @param action - A RankedAction produced by rankActions (includes finalScore + scoreBreakdown).
 * @returns ActionExplanation with headline, ordered reasons, data sources, and confidence.
 *
 * @example
 * const explanation = explainAction(rankedPrimary);
 * // { headline: "Conformità normativa richiede attenzione — …", confidence: 0.75, … }
 */
export function explainAction(action: RankedAction): ActionExplanation {
  const breakdown = action.scoreBreakdown;
  return {
    actionId:     action.id,
    headline:     buildHeadline(action, breakdown),
    reasons:      buildReasons(action, breakdown),
    dataUsed:     buildDataUsed(action, breakdown),
    confidence:   Math.min(action.finalScore / 200, 1),
    normativeRef: buildNormativeRef(action, breakdown),
  };
}
