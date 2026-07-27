/**
 * disparateImpactDetector.ts — Sprint 5: Bias Detection
 *
 * Compares group-level risk statistics against a baseline to detect
 * systematic disparities in the AI's predictions.
 *
 * Metrics computed per group (where group ≠ 'general'):
 *
 *  disparateImpactRatio (DIR):
 *    groupAtRiskRate / baselineAtRiskRate
 *    < 0.80 → under-prediction relative to baseline (group may be under-served)
 *    > 1.25 → over-prediction (group may be unfairly flagged)
 *    Undefined (null) when baseline rate is 0.
 *
 *  meanRiskDifference (MRD):
 *    groupAvgRiskScore − baselineAvgRiskScore
 *    |MRD| > THRESHOLD_MRD (0.12) is flagged.
 *
 *  gradeAdjustedGap (GAG):
 *    Similar to MRD but risk scores are compared controlling for gradeAverage.
 *    Approximated as: MRD − GRADE_WEIGHT × (groupAvgGrade − baselineAvgGrade)
 *    GRADE_WEIGHT = 0.05 per grade point.
 *    A large positive GAG suggests the model penalises the group beyond
 *    what its academic performance justifies.
 *
 *  falseAlarmGap (FAG):
 *    groupFalseAlarmRate − baselineFalseAlarmRate
 *    > THRESHOLD_FAG (0.10) flagged.
 *
 * A disparity is considered significant when ANY single threshold is exceeded
 * AND the group has at least MIN_GROUP_SIZE (3) members.
 */

import type { AIExplanation } from '../explainability/decisionExplainer';
import {
  type GroupProfile,
  complementIds,
  profileGroups,
} from './groupProfiler';
import type { Studente } from '@/types/student.types';

// ── constants ─────────────────────────────────────────────────────────────────

const MIN_GROUP_SIZE  = 3;
const THRESHOLD_DIR_LOW  = 0.80;
const THRESHOLD_DIR_HIGH = 1.25;
const THRESHOLD_MRD  = 0.12;
const THRESHOLD_FAG  = 0.10;
const GRADE_WEIGHT   = 0.05;

// ── types ─────────────────────────────────────────────────────────────────────

export type DisparityFlag =
  | 'dir_low'          // group under-predicted vs baseline
  | 'dir_high'         // group over-predicted vs baseline
  | 'mean_risk_high'   // group avg risk score significantly above baseline
  | 'mean_risk_low'    // group avg risk score significantly below baseline
  | 'grade_adjusted_gap' // risk gap persists after controlling for grades
  | 'false_alarm_high';  // high rate of false alarms (risk≥0.5 but grade≥6)

export interface DisparityMetric {
  /** Group identifier, e.g. 'bes', 'classe:3A' */
  groupId: string;
  /** Human-readable label */
  label: string;
  /** Which protected axis */
  attribute: string;
  /** Absolute group size */
  sampleSize: number;
  /** Whether the group meets the minimum sample threshold */
  sufficientSample: boolean;
  /** P(at_risk | group) / P(at_risk | baseline) — null if baseline is 0 */
  disparateImpactRatio: number | null;
  /** Group avgRiskScore − baseline avgRiskScore */
  meanRiskDifference: number;
  /** Grade-adjusted risk gap */
  gradeAdjustedGap: number;
  /** Group falseAlarmRate − baseline falseAlarmRate */
  falseAlarmGap: number;
  /** Active flags for this group */
  flags: DisparityFlag[];
  /** At least one flag and sufficient sample */
  significant: boolean;
}

// ── internal ──────────────────────────────────────────────────────────────────

function computeMetric(
  profile: GroupProfile,
  baseline: GroupProfile,
): DisparityMetric {
  const sufficientSample = profile.size >= MIN_GROUP_SIZE;

  const disparateImpactRatio =
    baseline.atRiskRate > 0
      ? profile.atRiskRate / baseline.atRiskRate
      : null;

  const meanRiskDifference = profile.avgRiskScore - baseline.avgRiskScore;

  const gradeAdjustedGap =
    meanRiskDifference -
    GRADE_WEIGHT * (profile.avgGradeAverage - baseline.avgGradeAverage);

  const falseAlarmGap = profile.falseAlarmRate - baseline.falseAlarmRate;

  const flags: DisparityFlag[] = [];
  if (disparateImpactRatio !== null) {
    if (disparateImpactRatio < THRESHOLD_DIR_LOW)  flags.push('dir_low');
    if (disparateImpactRatio > THRESHOLD_DIR_HIGH) flags.push('dir_high');
  }
  if (meanRiskDifference >  THRESHOLD_MRD) flags.push('mean_risk_high');
  if (meanRiskDifference < -THRESHOLD_MRD) flags.push('mean_risk_low');
  if (Math.abs(gradeAdjustedGap) > THRESHOLD_MRD) flags.push('grade_adjusted_gap');
  if (falseAlarmGap > THRESHOLD_FAG) flags.push('false_alarm_high');

  return {
    groupId:    profile.id,
    label:      profile.label,
    attribute:  profile.attribute,
    sampleSize: profile.size,
    sufficientSample,
    disparateImpactRatio,
    meanRiskDifference,
    gradeAdjustedGap,
    falseAlarmGap,
    flags,
    significant: flags.length > 0 && sufficientSample,
  };
}

// ── main exports ──────────────────────────────────────────────────────────────

/**
 * Detect disparities for each non-general group, compared to the overall
 * class baseline.
 *
 * @param profiles  Output of profileGroups()
 * @returns Array of DisparityMetric, one per group (excluding 'general')
 */
export function detectDisparities(
  profiles: GroupProfile[],
): DisparityMetric[] {
  const baseline = profiles.find(p => p.id === 'general');
  if (!baseline) return [];

  return profiles
    .filter(p => p.id !== 'general')
    .map(p => computeMetric(p, baseline));
}

/**
 * Convenience: profile groups then detect disparities in one call.
 */
export function analyzeClassFairness(
  students: Studente[],
  explanations: Map<string, AIExplanation>,
): {
  profiles: GroupProfile[];
  metrics:  DisparityMetric[];
} {
  const profiles = profileGroups(students, explanations);
  const metrics  = detectDisparities(profiles);
  return { profiles, metrics };
}

// re-export constants for use in tests / UI
export { MIN_GROUP_SIZE, THRESHOLD_DIR_LOW, THRESHOLD_DIR_HIGH, THRESHOLD_MRD, THRESHOLD_FAG };
// re-export complementIds for tests
export { complementIds };
