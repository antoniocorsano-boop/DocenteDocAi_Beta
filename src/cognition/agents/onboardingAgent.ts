/**
 * onboardingAgent.ts — Onboarding / Guided Journey Agent.
 *
 * Manages initial setup guidance. Detects where the teacher is in their
 * journey and suggests the minimum viable next setup step.
 *
 * Philosophy: always reach a valid output; never block the teacher.
 * Missing data is warned but never required before proceeding.
 */

import type { AgentContext, AgentSuggestion } from './types';

export const AGENT_ID = 'onboarding';

/**
 * Setup milestone checklist (ordered by progression).
 * Each step is independent — can be skipped but will be suggested again.
 */
interface SetupMilestone {
  id: string;
  label: string;
  description: string;
  reason: string;
  icon: string;
  actionKey: string;
  targetView: string;
  priority: number;
  /** Returns true when this milestone is complete */
  isComplete: (ctx: AgentContext) => boolean;
}

const MILESTONES: SetupMilestone[] = [
  {
    id: 'ob-profile',
    label: 'Completa il tuo profilo',
    description: 'Aggiungi nome, materia e scuola per personalizzare il Copilot.',
    reason: 'Il profilo docente permette al Copilot di adattare i suggerimenti alla tua materia e al tuo contesto.',
    icon: 'account_circle',
    actionKey: 'settings.profile',
    targetView: 'settings',
    priority: 85,
    isComplete: (ctx) => Boolean(ctx.user?.displayName && ctx.user?.displayName.trim().length > 0),
  },
  {
    id: 'ob-first-class',
    label: 'Aggiungi la prima classe',
    description: 'Crea una classe per iniziare a gestire studenti e presenze.',
    reason: 'Senza una classe configurata, valutazioni, registro e analisi non sono disponibili.',
    icon: 'group_add',
    actionKey: 'classroom.add_class',
    targetView: 'classroom',
    priority: 82,
    isComplete: (ctx) => ctx.students.filter((s) => !s.isArchived).length > 0,
  },
  {
    id: 'ob-first-lesson',
    label: 'Crea la prima lezione',
    description: 'Registra almeno una lezione per avviare il tuo storico didattico.',
    reason: 'Lo storico lezioni alimenta il Copilot: più dati hai, più precisi sono i suggerimenti.',
    icon: 'edit_document',
    actionKey: 'classroom.create_lesson',
    targetView: 'classroom',
    priority: 78,
    isComplete: (ctx) => ctx.lessons.length > 0,
  },
  {
    id: 'ob-first-uda',
    label: 'Pianifica la prima UDA',
    description: 'Una Unità Didattica struttura obiettivi e attività del percorso.',
    reason: "Le UDA collegano lezioni, valutazioni e obiettivi in un'unica visione pedagogica.",
    icon: 'layers',
    actionKey: 'planning.create_uda',
    targetView: 'planning',
    priority: 74,
    isComplete: (ctx) => ctx.uda.length > 0,
  },
];

export function runOnboardingAgent(ctx: AgentContext): AgentSuggestion[] {
  // Only active if teacher is still in setup phase
  const isSetupPhase =
    ctx.capabilityLevel === 1 ||
    MILESTONES.some((m) => !m.isComplete(ctx));

  if (!isSetupPhase) return [];

  // Find the first incomplete milestone
  const next = MILESTONES.find((m) => !m.isComplete(ctx));
  if (!next) return [];

  return [
    {
      id: next.id,
      agentId: AGENT_ID,
      label: next.label,
      description: next.description,
      reason: next.reason,
      priority: next.priority,
      icon: next.icon,
      actionKey: next.actionKey,
      targetView: next.targetView,
    },
  ];
}
