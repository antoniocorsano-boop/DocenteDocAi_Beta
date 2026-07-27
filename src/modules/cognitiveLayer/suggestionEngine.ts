/**
 * cognitiveLayer/suggestionEngine.ts
 *
 * Genera suggerimenti contestuali a partire da una CognitiveEntry classificata.
 *
 * Regole:
 *   - compliance + score < 80  → WARNING + suggerimento DPIA/audit
 *   - commercial + nessun pack → NEXT_STEP → genera pack
 *   - pedagogical              → INSIGHT   → esporta UDA / archivia
 *   - cross-domain             → CROSS_DOMAIN se più domini attivi
 *
 * Il motore è puro (no side-effects) — chiamarlo è sempre sicuro.
 */

import type { CognitiveEntry, CognitiveSuggestion, CognitiveDomain, ScheduleContext } from './types';

// ─── ID helper ────────────────────────────────────────────────────────────────

function suggId(sourceId: string, type: string): string {
  return `sugg_${type.toLowerCase()}_${sourceId.slice(-6)}_${Date.now().toString(36)}`;
}

// ─── Rule-based suggestion builders ──────────────────────────────────────────

function warn(
  entry: CognitiveEntry,
  title: string,
  description: string,
  cta?: string,
  ctaType?: string,
): CognitiveSuggestion {
  return {
    id: suggId(entry.id, 'WARN'),
    type: 'WARNING',
    priority: 'high',
    domain: entry.domain,
    title, description, cta, ctaType,
    sourceEntryId: entry.id,
    generatedAt: Date.now(),
  };
}

function nextStep(
  entry: CognitiveEntry,
  title: string,
  description: string,
  cta: string,
  ctaType: string,
): CognitiveSuggestion {
  return {
    id: suggId(entry.id, 'NEXT'),
    type: 'NEXT_STEP',
    priority: 'medium',
    domain: entry.domain,
    title, description, cta, ctaType,
    sourceEntryId: entry.id,
    generatedAt: Date.now(),
  };
}

function insight(
  entry: CognitiveEntry,
  title: string,
  description: string,
): CognitiveSuggestion {
  return {
    id: suggId(entry.id, 'INS'),
    type: 'INSIGHT',
    priority: 'low',
    domain: entry.domain,
    title, description,
    sourceEntryId: entry.id,
    generatedAt: Date.now(),
  };
}

// ─── Domain-specific rules ────────────────────────────────────────────────────

function rulesForCompliance(entry: CognitiveEntry): CognitiveSuggestion[] {
  const suggestions: CognitiveSuggestion[] = [];
  const contentLower = entry.content.toLowerCase();

  if (contentLower.includes('violazione') || contentLower.includes('non conforme')) {
    suggestions.push(warn(
      entry,
      'Violazione rilevata nel documento',
      'Il contenuto segnala una o più violazioni di conformità. Eseguire un audit completo.',
      'Avvia audit',
      'RUN_AUDIT',
    ));
  }

  if (contentLower.includes('dpia') && !contentLower.includes('completata')) {
    suggestions.push(nextStep(
      entry,
      'DPIA non completata',
      'Il documento fa riferimento a una DPIA non ancora finalizzata.',
      'Genera DPIA',
      'GENERATE_DPIA',
    ));
  }

  if (contentLower.includes('scadenza') || contentLower.includes('entro')) {
    suggestions.push(warn(
      entry,
      'Scadenza rilevata',
      'Il documento menziona una scadenza. Verificare le date e i rispettivi adempimenti.',
    ));
  }

  return suggestions;
}

function rulesForCommercial(entry: CognitiveEntry): CognitiveSuggestion[] {
  const suggestions: CognitiveSuggestion[] = [];
  const contentLower = entry.content.toLowerCase();

  if (contentLower.includes('pilota') || contentLower.includes('demo')) {
    suggestions.push(nextStep(
      entry,
      'Prepara Sales Pack per la demo',
      'Stai lavorando su una proposta pilota. Genera il Sales Pack completo per la presentazione.',
      'Genera Sales Pack',
      'GENERATE_SALES_PACK',
    ));
  }

  if (contentLower.includes('offerta') || contentLower.includes('pricing')) {
    suggestions.push(insight(
      entry,
      'Documenta l\'offerta nel Sales Pack',
      'Il contenuto riguarda un\'offerta commerciale. Il Sales Pack può includere questa informazione.',
    ));
  }

  return suggestions;
}

function rulesForPedagogical(entry: CognitiveEntry, scheduleHint?: ScheduleContext): CognitiveSuggestion[] {
  const suggestions: CognitiveSuggestion[] = [];
  const contentLower = entry.content.toLowerCase();

  if (contentLower.includes('uda') || contentLower.includes('unità di apprendimento')) {
    suggestions.push(nextStep(
      entry,
      'Archivia o esporta l\'UDA',
      'Il documento contiene un\'UDA. Archiviarla o esportarla in formato PDF.',
      'Esporta UDA',
      'EXPORT_UDA',
    ));
  }

  if (contentLower.includes('valutazione') || contentLower.includes('rubrica')) {
    suggestions.push(insight(
      entry,
      'Rubrica valutativa rilevata',
      'Il testo contiene criteri di valutazione. Considera di collegarlo a un\'UDA esistente.',
    ));
  }

  // ─── Regole schedule-aware (attivate solo se scheduleHint disponibile) ───

  if (scheduleHint) {
    const { minsToLesson, lessonType } = scheduleHint;

    // Lezione imminente (≤15 min) → apri registro in anticipo
    if (minsToLesson !== undefined && minsToLesson <= 15 && minsToLesson > -60) {
      suggestions.push(nextStep(
        entry,
        'Lezione imminente — apri il registro',
        `Mancano ${Math.max(0, minsToLesson)} minuti all'inizio. Compila il registro ora.`,
        'Apri registro',
        'OPEN_REGISTER',
      ));
    }

    // Lezione di tipo Laboratorio → suggerisci di caricare il deliverable
    if (lessonType === 'Laboratorio') {
      suggestions.push(nextStep(
        entry,
        'Prepara il deliverable per il lab',
        'La prossima lezione è di Laboratorio. Carica o prepara il materiale da distribuire.',
        'Carica deliverable',
        'LOAD_DELIVERABLE',
      ));
    }
  }

  return suggestions;
}

function rulesForAdministrative(entry: CognitiveEntry): CognitiveSuggestion[] {
  const suggestions: CognitiveSuggestion[] = [];
  const contentLower = entry.content.toLowerCase();

  if (contentLower.includes('verbale') || contentLower.includes('timbro')) {
    suggestions.push(nextStep(
      entry,
      'Registra nel Trust Layer',
      'Il documento è di tipo ufficiale. Registrarlo come record trust per tracciabilità.',
      'Registra',
      'CREATE_TRUST_RECORD',
    ));
  }

  return suggestions;
}

// ─── Main engine ──────────────────────────────────────────────────────────────

/**
 * Genera un array di suggerimenti per una CognitiveEntry già classificata.
 * Restituisce sempre un array (vuoto se nessuna regola si attiva).
 *
 * @param entry         - Entry classificata
 * @param scheduleHint  - Contesto orario opzionale per regole time-sensitive
 */
export function generateSuggestions(entry: CognitiveEntry, scheduleHint?: ScheduleContext): CognitiveSuggestion[] {
  const suggestions: CognitiveSuggestion[] = [];

  switch (entry.domain as CognitiveDomain) {
    case 'compliance':
      suggestions.push(...rulesForCompliance(entry));
      break;
    case 'commercial':
      suggestions.push(...rulesForCommercial(entry));
      break;
    case 'pedagogical':
      suggestions.push(...rulesForPedagogical(entry, scheduleHint));
      break;
    case 'administrative':
      suggestions.push(...rulesForAdministrative(entry));
      break;
    default:
      // unknown / technical / operational — nessuna regola specifica
      break;
  }

  // Ordina: critical → high → medium → low
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return suggestions.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
}
