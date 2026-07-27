/**
 * regulatoryAgent.ts — Compliance & Administrative Agent.
 *
 * Checks: data completeness, missing evaluations, incomplete student records.
 * Active at all capabilityLevels.
 */

import type { AgentContext, AgentSuggestion } from './types';

export const AGENT_ID = 'regulatory';

export function runRegulatoryAgent(ctx: AgentContext): AgentSuggestion[] {
  const suggestions: AgentSuggestion[] = [];

  const activeStudents = ctx.students.filter((s) => !s.isArchived);

  // ── R1: Students have no evaluations ──────────────────────────────────────
  if (activeStudents.length > 0 && ctx.evaluations.length === 0 && ctx.capabilityLevel >= 2) {
    suggestions.push({
      id: 'reg-missing-evaluations',
      agentId: AGENT_ID,
      label: 'Registra le prime valutazioni',
      description: `Hai ${activeStudents.length} studenti ma nessuna valutazione registrata.`,
      reason: 'Le valutazioni sono obbligatorie per il registro e abilitano le analisi AI.',
      priority: 72,
      icon: 'grading',
      actionKey: 'classroom.add_evaluation',
      targetView: 'classroom',
    });
  }

  // ── R2: Students missing last name ────────────────────────────────────────
  const incompleteStudents = activeStudents.filter((s) => !s.cognome?.trim());
  if (incompleteStudents.length > 0) {
    suggestions.push({
      id: 'reg-incomplete-profiles',
      agentId: AGENT_ID,
      label: 'Completa i profili studenti',
      description: `${incompleteStudents.length} studenti hanno il profilo incompleto (cognome mancante).`,
      reason: 'I profili incompleti possono causare errori nella generazione di documenti ufficiali.',
      priority: 65,
      icon: 'person_alert',
      actionKey: 'classroom.complete_profiles',
      targetView: 'classroom',
    });
  }

  // ── R3: Classes without students ─────────────────────────────────────────
  // Detected by: UDA references class names but no student is in that class
  const udaSubjects = new Set(ctx.uda.map((u) => (u as { classeRef?: string }).classeRef).filter(Boolean));
  const studentClasses = new Set(activeStudents.map((s) => s.classe));
  const emptyUdaClasses = [...udaSubjects].filter((c) => c && !studentClasses.has(c));
  if (emptyUdaClasses.length > 0) {
    suggestions.push({
      id: 'reg-uda-without-class',
      agentId: AGENT_ID,
      label: 'UDA senza studenti associati',
      description: `${emptyUdaClasses.length} UDA fanno riferimento a classi senza studenti registrati.`,
      reason: 'Per generare analisi e documenti, ogni UDA deve avere studenti associati.',
      priority: 60,
      icon: 'warning',
      actionKey: 'classroom.add_students_to_class',
      targetView: 'classroom',
    });
  }

  return suggestions;
}
