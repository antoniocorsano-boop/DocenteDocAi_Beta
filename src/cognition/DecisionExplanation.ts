/**
 * DecisionExplanation — human-readable explanation of why a suggestion is shown.
 *
 * buildDecisionExplanation(suggestion, model) maps:
 *   - suggestion.reason     → primary explanation text
 *   - model usage state     → 1–3 context-specific fact lines
 *   - workflowPatterns      → list of event names that contributed
 *
 * Used by JourneyProgressPanel "Perché questo suggerimento?" popover.
 */

import type { CopilotSuggestion, TeacherModel } from '../types/teacherModel.types';

export interface DecisionExplanation {
  /** Ordered list of human-readable reasons — first item is the primary reason */
  reasons: string[];
  /** Event names that contributed to this decision, as evidence */
  basedOnEvents: string[];
}

// ── Event evidence map ────────────────────────────────────────────────────────

/** Maps actionKey to the event names that are evidence for that suggestion */
const ACTION_EVENT_MAP: Record<string, string[]> = {
  'classroom.attendance':          ['lesson.created'],
  'classroom.add_class':           [],
  'copilot.open':                  [],
  'planning.create_uda':           ['workspace.configured'],
  'planning.integrate_book':       ['book.account.linked'],
  'planning.annual_plan':          ['uda.created', 'planning.wizard.completed'],
  'settings.drive_backup':         ['lesson.created', 'evaluation.added'],
  'settings.mode_semi_osmotica':   ['lesson.created', 'copilot.manual_prompt'],
  'settings.mode_osmotica':        ['copilot.suggestion.accepted', 'copilot.automation.enabled'],
  'copilot.artistic_open':         ['class.first_student_added', 'lesson.created'],
  'copilot.analytics':             ['analytics.viewed'],
  'copilot.automation_full':       ['copilot.manual_prompt', 'copilot.suggestion.accepted'],
};

// ── Context facts from model ──────────────────────────────────────────────────

function modelContextReasons(suggestion: CopilotSuggestion, model: TeacherModel): string[] {
  const facts: string[] = [];
  const usage = model.usageProfile;

  if (usage.lessonsCreated > 0) {
    facts.push(
      `Hai registrato ${usage.lessonsCreated} lezione${usage.lessonsCreated !== 1 ? 'i' : ''}`,
    );
  }

  if (usage.lessonsCreated === 0 && suggestion.actionKey === 'classroom.add_class') {
    facts.push('Non hai ancora configurato una classe');
    facts.push('Molte funzionalità richiedono almeno una classe o uno studente');
  }

  if (usage.udaCreated > 0 && suggestion.actionKey === 'planning.annual_plan') {
    facts.push(`Hai creato ${usage.udaCreated} UDA`);
  }

  if (
    usage.copilotRequests > 0 &&
    ['copilot.analytics', 'settings.mode_semi_osmotica', 'settings.mode_osmotica'].includes(
      suggestion.actionKey,
    )
  ) {
    facts.push(
      `Hai usato il Copilot ${usage.copilotRequests} volta${usage.copilotRequests !== 1 ? '' : ''}`,
    );
  }

  if ((usage.bookServicesLinked ?? 0) > 0 && suggestion.actionKey === 'planning.integrate_book') {
    facts.push(
      `Hai collegato ${usage.bookServicesLinked} servizio${(usage.bookServicesLinked ?? 0) !== 1 ? 'i' : ''} libro`,
    );
  }

  // Workflow pattern evidence
  const patternIds = model.workflowPatterns.map((p) => p.patternId);
  if (patternIds.includes('lessonWorkflow') && suggestion.actionKey === 'settings.drive_backup') {
    facts.push('Hai un flusso lezioni attivo che vale la pena proteggere');
  }
  if (patternIds.includes('planningWorkflow') && suggestion.actionKey === 'planning.annual_plan') {
    facts.push('Hai già completato un ciclo di pianificazione UDA');
  }

  return facts;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Builds a human-readable explanation of why a suggestion is shown.
 *
 * @param suggestion - The CopilotSuggestion to explain
 * @param model      - Current TeacherModel snapshot
 * @returns DecisionExplanation with reasons[] and basedOnEvents[]
 */
export function buildDecisionExplanation(
  suggestion: CopilotSuggestion,
  model: TeacherModel,
): DecisionExplanation {
  const reasons: string[] = [];

  // Primary reason from the suggestion itself
  if (suggestion.reason) {
    reasons.push(suggestion.reason);
  }

  // Context-specific facts from model state
  const contextFacts = modelContextReasons(suggestion, model);
  for (const fact of contextFacts) {
    if (!reasons.includes(fact)) reasons.push(fact);
  }

  // Evidence events
  const basedOnEvents = ACTION_EVENT_MAP[suggestion.actionKey] ?? [];

  return { reasons, basedOnEvents };
}
