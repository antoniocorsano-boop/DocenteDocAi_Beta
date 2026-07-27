/**
 * modules/orchestration/TaskPlanner.ts — P33 Cognitive Orchestration Layer
 *
 * Converts an IntentResult into an ordered list of TaskSteps ready for
 * execution by the CognitiveOrchestrator.
 *
 * Design principles:
 *   - Fully deterministic (no randomness, no timestamps in step IDs)
 *   - Steps are either independent (dependsOn: []) → run in parallel
 *     or sequential (dependsOn: ['step-N']) → run after their dependency
 *   - Every plan has at least one step (no empty plans)
 *
 * Step execution model:
 *   - Steps with empty dependsOn form ROUND-1 (executed in parallel)
 *   - Steps with non-empty dependsOn form subsequent rounds, using the
 *     enriched input that includes all prior step outputs
 *
 * P34 upgrade path: replace with a dynamic LLM-driven planner that sub-divides
 * free-form inputs into semantic steps with cross-step data passing.
 */

import type { IntentResult } from './IntentEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TaskStep {
  /** Identifier for cross-step references in `dependsOn` */
  id:          string;
  /** Human-readable description emitted to observability */
  description: string;
  /** Agent ID to invoke for this step */
  agent:       string;
  /**
   * IDs of steps that must complete before this step starts.
   * Empty array (or omitted) → step can run in parallel in the first round.
   */
  dependsOn?:  string[];
}

// ── Planner ───────────────────────────────────────────────────────────────────

/**
 * Build an execution plan from an IntentResult.
 *
 * Plans by intent type:
 *   simple     → 1 step: cognitive agent
 *   compliance → 1 step: compliance agent
 *   monitoring → 1 step: monitoring agent
 *   analysis   → 2 steps sequential: initial context (cognitive) →
 *                                    deep analysis (cognitive)
 *   multi_step → 2 steps sequential: analysis (cognitive) →
 *                                    compliance check (compliance)
 *
 * Never throws. Falls back to a single cognitive step if input is unexpected.
 */
export function plan(intent: IntentResult, _input: string): TaskStep[] {
  const primaryAgent = intent.agents[0] ?? 'agent.cognitive';

  switch (intent.type) {

    case 'compliance':
      return [
        {
          id:          'step-1',
          description: 'Verifica conformità e obblighi normativi',
          agent:       'agent.compliance',
          dependsOn:   [],
        },
      ];

    case 'monitoring':
      return [
        {
          id:          'step-1',
          description: 'Raccolta metriche e stato del sistema',
          agent:       'agent.monitoring',
          dependsOn:   [],
        },
      ];

    case 'analysis':
      return [
        {
          id:          'step-1',
          description: 'Elaborazione iniziale e raccolta contesto',
          agent:       'agent.cognitive',
          dependsOn:   [],
        },
        {
          id:          'step-2',
          description: 'Analisi approfondita e sintesi degli insight',
          agent:       'agent.cognitive',
          dependsOn:   ['step-1'],   // sequential: uses step-1 output as context
        },
      ];

    case 'multi_step':
      return [
        {
          id:          'step-1',
          description: 'Analisi iniziale della richiesta',
          agent:       'agent.cognitive',
          dependsOn:   [],
        },
        {
          id:          'step-2',
          description: 'Verifica conformità sul contesto analizzato',
          agent:       'agent.compliance',
          dependsOn:   ['step-1'],  // compliance check can use cognitive output
        },
      ];

    case 'simple':
    default:
      return [
        {
          id:          'step-1',
          description: 'Elaborazione della richiesta',
          agent:       primaryAgent,
          dependsOn:   [],
        },
      ];
  }
}
