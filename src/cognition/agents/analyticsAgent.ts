/**
 * analyticsAgent.ts — Analytics & Evolution Tracking Agent.
 *
 * Tracks teacher's usage evolution and surfaces insights when enough
 * history exists. Suggests when the teacher should review their data.
 * Active at capabilityLevel >= 2.
 */

import type { AgentContext, AgentSuggestion } from './types';

export const AGENT_ID = 'analytics';

export function runAnalyticsAgent(ctx: AgentContext): AgentSuggestion[] {
  if (ctx.capabilityLevel < 2) return [];

  const suggestions: AgentSuggestion[] = [];
  const totalFeatureUses = Object.values(ctx.analyticsMetrics.featuresUsage ?? {}).reduce(
    (sum, n) => sum + (n as number),
    0,
  );

  // ── A1: First analytics visit when data is rich ───────────────────────────
  // 'analytics' feature_usage = teacher has opened the analytics view
  const analyticsViews = ctx.analyticsMetrics.featuresUsage['analytics'] ?? 0;

  if (
    analyticsViews === 0 &&
    totalFeatureUses >= 10 &&
    ctx.evaluations.length >= 3
  ) {
    suggestions.push({
      id: 'an-first-visit',
      agentId: AGENT_ID,
      label: 'Scopri i tuoi insight',
      description: "Hai abbastanza dati per un'analisi significativa. Apri la Dashboard AI.",
      reason: `${totalFeatureUses} azioni registrate + ${ctx.evaluations.length} valutazioni = dati sufficienti per trend e pattern.`,
      priority: 77,
      icon: 'analytics',
      actionKey: 'copilot.analytics',
      targetView: 'copilot',
    });
  }

  // ── A2: AI interactions growing — suggest Copilot exploration ────────────
  const aiCount = ctx.analyticsMetrics.aiInteractionsCount;
  if (aiCount >= 5 && aiCount % 10 === 0) {
    suggestions.push({
      id: 'an-ai-milestone',
      agentId: AGENT_ID,
      label: `${aiCount} interazioni AI!`,
      description: 'Il tuo utilizzo cresce. Esplora la tab Raccomandazioni per personalizzare il Copilot.',
      reason: 'Il tuo profilo AI è abbastanza ricco per suggerimenti avanzati personalizzati.',
      priority: 60,
      icon: 'auto_awesome',
      actionKey: 'copilot.recommendations',
      targetView: 'copilot',
    });
  }

  // ── A3: Recent activity spike — suggest weekly review ────────────────────
  if (ctx.recentEventCount >= 8) {
    suggestions.push({
      id: 'an-weekly-review',
      agentId: AGENT_ID,
      label: 'Riassunto attività recente',
      description: `${ctx.recentEventCount} azioni recenti. Vuoi un riepilogo della settimana?`,
      reason: 'Hai avuto molta attività di recente. Un riepilogo ti aiuta a mantenere il quadro completo.',
      priority: 52,
      icon: 'summarize',
      actionKey: 'copilot.weekly_summary',
      targetView: 'copilot',
    });
  }

  return suggestions;
}
