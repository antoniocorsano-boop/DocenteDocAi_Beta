/**
 * biasReport.ts — Sprint 5: Bias Detection
 *
 * Synthesises disparity metrics into a top-level bias report with:
 *   - an overall bias level (none / low / moderate / high)
 *   - a list of affected groups with their worst flags
 *   - Italian-language recommendations for the teacher
 */

import type { Studente } from '@/types/student.types';
import type { AIExplanation } from '../explainability/decisionExplainer';
import {
  analyzeClassFairness,
  type DisparityMetric,
  type DisparityFlag,
} from './disparateImpactDetector';
import type { GroupProfile } from './groupProfiler';

// ── types ─────────────────────────────────────────────────────────────────────

export type BiasLevel = 'none' | 'low' | 'moderate' | 'high';

export interface AffectedGroup {
  groupId: string;
  label:   string;
  /** The most severe flag on this group */
  primaryFlag: DisparityFlag;
  /** Short Italian description of the detected issue */
  issue: string;
}

export interface BiasReport {
  computedAt:       string;
  /** Aggregate bias severity */
  overallBiasLevel: BiasLevel;
  /** Human-readable Italian summary */
  summary:          string;
  /** All group profiles (includes 'general' baseline) */
  profiles:         GroupProfile[];
  /** One metric per non-general group */
  metrics:          DisparityMetric[];
  /** Only the groups where significant === true */
  affectedGroups:   AffectedGroup[];
  /** Actionable Italian recommendations */
  recommendations:  string[];
  /** Total number of groups analysed (excl. general) */
  groupsAnalysed:   number;
  /** Number of groups with significant disparities */
  significantCount: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const FLAG_ISSUE_IT: Record<DisparityFlag, string> = {
  dir_high:          'il gruppo viene predetto a rischio con frequenza sistematicamente maggiore rispetto alla media',
  dir_low:           'il gruppo viene predetto a rischio con frequenza sistematicamente inferiore rispetto alla media',
  mean_risk_high:    'il punteggio di rischio medio del gruppo supera significativamente quello generale',
  mean_risk_low:     'il punteggio di rischio medio del gruppo è significativamente inferiore alla media',
  grade_adjusted_gap:'il divario di rischio persiste anche dopo aver controllato per la media dei voti',
  false_alarm_high:  'elevata percentuale di falsi allarmi: studenti del gruppo segnalati a rischio pur con voti sufficienti',
};

const RECOMMENDATION_IT: Record<DisparityFlag, (label: string) => string> = {
  dir_high:          l => `Verificare se gli studenti del gruppo "${l}" ricevono un supporto adeguato o se la predizione riflette pregiudizi di dati storici.`,
  dir_low:           l => `Monitorare attivamente gli studenti del gruppo "${l}": la bassa frequenza di segnalazione potrebbe nascondere difficoltà reali.`,
  mean_risk_high:    l => `Rivedere i fattori di rischio prevalenti nel gruppo "${l}" per valutare se siano rappresentativi di effettive difficoltà.`,
  mean_risk_low:     l => `Assicurarsi che gli studenti del gruppo "${l}" non siano sistematicamente sottovalutati dal modello.`,
  grade_adjusted_gap:l => `Il rischio del gruppo "${l}" non è interamente spiegabile dalla performance accademica: approfondire le cause.`,
  false_alarm_high:  l => `Ridurre l'impatto dei falsi allarmi sul gruppo "${l}": valutare strategie di supporto that don't stigmatize students.`,
};

/** Priority order for selecting the "primaryFlag" */
const FLAG_SEVERITY: DisparityFlag[] = [
  'grade_adjusted_gap',
  'dir_high',
  'dir_low',
  'false_alarm_high',
  'mean_risk_high',
  'mean_risk_low',
];

function pickPrimaryFlag(flags: DisparityFlag[]): DisparityFlag {
  for (const f of FLAG_SEVERITY) {
    if (flags.includes(f)) return f;
  }
  return flags[0];
}

function computeBiasLevel(significantCount: number, metrics: DisparityMetric[]): BiasLevel {
  if (significantCount === 0) return 'none';

  // Severity scale:
  // high if any group has grade_adjusted_gap OR dir_high with large DIR
  const hasHighSeverity = metrics.some(m =>
    m.significant && (
      m.flags.includes('grade_adjusted_gap') ||
      (m.flags.includes('dir_high') && m.disparateImpactRatio !== null && m.disparateImpactRatio > 1.50) ||
      (m.flags.includes('dir_low')  && m.disparateImpactRatio !== null && m.disparateImpactRatio < 0.60)
    ),
  );
  if (hasHighSeverity)     return 'high';
  if (significantCount >= 3) return 'moderate';
  return 'low';
}

function buildSummary(level: BiasLevel, significantCount: number, groupsAnalysed: number): string {
  if (level === 'none') {
    return `Nessuna disparità significativa rilevata. Il modello mostra comportamento equo nei confronti di tutti i ${groupsAnalysed} gruppi analizzati.`;
  }
  const levelLabel = { low: 'basso', moderate: 'moderato', high: 'elevato' }[level];
  return `Livello di bias ${levelLabel}: ${significantCount} su ${groupsAnalysed} gruppi presentano disparità statisticamente rilevanti nelle predizioni di rischio. Consultare le raccomandazioni per gli interventi correttivi.`;
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Generate a complete bias report for the current class.
 *
 * @param students     All students in the scope
 * @param explanations Map from explainabilityStore (or explainClass())
 */
export function generateBiasReport(
  students: Studente[],
  explanations: Map<string, AIExplanation>,
): BiasReport {
  const { profiles, metrics } = analyzeClassFairness(students, explanations);

  const significantMetrics = metrics.filter(m => m.significant);
  const significantCount   = significantMetrics.length;
  const overallBiasLevel   = computeBiasLevel(significantCount, metrics);

  const affectedGroups: AffectedGroup[] = significantMetrics.map(m => {
    const primaryFlag = pickPrimaryFlag(m.flags);
    return {
      groupId:     m.groupId,
      label:       m.label,
      primaryFlag,
      issue:       FLAG_ISSUE_IT[primaryFlag],
    };
  });

  // Collect unique recommendations (one per flag per group, de-duplicated by flag type)
  const seenFlags = new Set<DisparityFlag>();
  const recommendations: string[] = [];
  for (const m of significantMetrics) {
    const primary = pickPrimaryFlag(m.flags);
    if (!seenFlags.has(primary)) {
      seenFlags.add(primary);
      recommendations.push(RECOMMENDATION_IT[primary](m.label));
    }
  }

  return {
    computedAt:      new Date().toISOString(),
    overallBiasLevel,
    summary:         buildSummary(overallBiasLevel, significantCount, metrics.length),
    profiles,
    metrics,
    affectedGroups,
    recommendations,
    groupsAnalysed:  metrics.length,
    significantCount,
  };
}

// re-export types for single-import consumers
export type { GroupProfile, DisparityMetric, DisparityFlag };
