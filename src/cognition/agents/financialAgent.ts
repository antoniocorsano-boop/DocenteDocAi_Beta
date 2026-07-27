/**
 * financialAgent.ts — Analytical / KPI Agent.
 *
 * Computes workload metrics, evaluation density, and progression KPIs.
 * Surfaces insights and warns about imbalances.
 * Active at capabilityLevel >= 2.
 */

import type { AgentContext, AgentSuggestion } from './types';

export const AGENT_ID = 'financial';

export function runFinancialAgent(ctx: AgentContext): AgentSuggestion[] {
  if (ctx.capabilityLevel < 2) return [];

  const suggestions: AgentSuggestion[] = [];
  const activeStudents = ctx.students.filter((s) => !s.isArchived);

  // ── F1: High eval density — surface analytics ─────────────────────────────
  const evalPerStudent =
    activeStudents.length > 0 ? ctx.evaluations.length / activeStudents.length : 0;

  const analyticsViews = ctx.analyticsMetrics.featuresUsage['analytics'] ?? 0;
  if (evalPerStudent >= 3 && analyticsViews === 0) {
    suggestions.push({
      id: 'fin-unlock-analytics',
      agentId: AGENT_ID,
      label: 'Insight disponibili',
      description: `${ctx.evaluations.length} valutazioni registrate: la Dashboard AI può mostrarti trend e rischi.`,
      reason: 'Hai abbastanza dati per analisi predittive. Apri la Dashboard AI per vederli.',
      priority: 76,
      icon: 'insights',
      actionKey: 'copilot.analytics',
      targetView: 'copilot',
    });
  }

  // ── F2: Uneven workload between classes ───────────────────────────────────
  const classCounts: Record<string, number> = {};
  for (const s of activeStudents) {
    classCounts[s.classe] = (classCounts[s.classe] ?? 0) + 1;
  }
  const counts = Object.values(classCounts);
  if (counts.length >= 2) {
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    if (max / min >= 2.5) {
      suggestions.push({
        id: 'fin-class-imbalance',
        agentId: AGENT_ID,
        label: 'Classi sbilanciate',
        description: `Una classe ha ${max} studenti, un'altra solo ${min}. Il Copilot può suggerire come gestire il divario.`,
        reason: 'Un rapporto studenti/classe molto sbilanciato può indicare dati mancanti o classi da riequilibrare.',
        priority: 55,
        icon: 'balance',
        actionKey: 'classroom.rebalance',
        targetView: 'classroom',
      });
    }
  }

  // ── F3: Suggest exporting report when enough data exists ──────────────────
  if (
    ctx.analyticsMetrics.totalDocumentsGenerated === 0 &&
    ctx.uda.length >= 2 &&
    activeStudents.length >= 5
  ) {
    suggestions.push({
      id: 'fin-export-report',
      agentId: AGENT_ID,
      label: 'Genera il tuo primo report',
      description: 'Hai dati sufficienti per esportare un report di classe completo.',
      reason: 'Il report documenta il percorso didattico e può essere usato per il consiglio di classe.',
      priority: 62,
      icon: 'summarize',
      actionKey: 'planning.export_report',
      targetView: 'copilot',
    });
  }

  return suggestions;
}
