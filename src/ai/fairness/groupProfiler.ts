/**
 * groupProfiler.ts — Sprint 5: Bias Detection
 *
 * Partitions students into demographic groups based on protected attributes
 * (BES, DSA, L.104) and class membership, then computes descriptive statistics
 * per group that feed into the disparate impact analysis.
 *
 * Groups:
 *   'bes'     — students with hasBES === true
 *   'dsa'     — students with hasDSA === true
 *   '104'     — students with has104 === true
 *   'support' — any support category (BES | DSA | 104) — supergroup
 *   'classe'  — per distinct classe string (e.g. '3A', '3B')
 *   'general' — all students (baseline)
 */

import type { Studente } from '@/types/student.types';
import type { AIExplanation } from '../explainability/decisionExplainer';

// ── types ─────────────────────────────────────────────────────────────────────

export type GroupAttribute =
  | 'bes'
  | 'dsa'
  | '104'
  | 'support'
  | 'classe'
  | 'general';

export interface GroupProfile {
  /** Stable identifier, e.g. 'bes', 'classe:3A', 'general' */
  id: string;
  /** Human-readable Italian label */
  label: string;
  /** Which protected axis this group belongs to */
  attribute: GroupAttribute;
  /** Student ids that belong to this group */
  studentIds: string[];
  /** Number of students */
  size: number;
  /** Mean risk score across the group [0, 1] */
  avgRiskScore: number;
  /** Mean grade average across the group [0, 10] */
  avgGradeAverage: number;
  /** Fraction of students with riskScore ≥ 0.50 */
  atRiskRate: number;
  /** Fraction of students with riskScore ≥ 0.70 (critical tier) */
  criticalRate: number;
  /**
   * Fraction of students with riskScore ≥ 0.50 but gradeAverage ≥ 6
   * (i.e. flagged at-risk despite adequate grades — possible false alarm)
   */
  falseAlarmRate: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function buildProfile(
  id: string,
  label: string,
  attribute: GroupAttribute,
  studentIds: string[],
  explanationMap: Map<string, AIExplanation>,
): GroupProfile {
  const exps = studentIds
    .map(sid => explanationMap.get(sid))
    .filter((e): e is AIExplanation => e !== undefined);

  if (exps.length === 0) {
    return {
      id, label, attribute,
      studentIds,
      size: studentIds.length,
      avgRiskScore: 0,
      avgGradeAverage: 0,
      atRiskRate: 0,
      criticalRate: 0,
      falseAlarmRate: 0,
    };
  }

  const avgRiskScore   = exps.reduce((s, e) => s + e.riskScore, 0) / exps.length;
  const avgGradeAverage = exps.reduce((s, e) => s + e.gradeAverage, 0) / exps.length;
  const atRiskRate     = exps.filter(e => e.riskScore >= 0.50).length / exps.length;
  const criticalRate   = exps.filter(e => e.riskScore >= 0.70).length / exps.length;
  const falseAlarmRate = exps.filter(e => e.riskScore >= 0.50 && e.gradeAverage >= 6).length / exps.length;

  return {
    id, label, attribute,
    studentIds,
    size: studentIds.length,
    avgRiskScore,
    avgGradeAverage,
    atRiskRate,
    criticalRate,
    falseAlarmRate,
  };
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * Profile all relevant demographic sub-groups from a class.
 *
 * Returns an array of GroupProfile objects. If a group has fewer than
 * MIN_GROUP_SIZE members it is still represented but flagged as small
 * (callers should treat its statistics with caution).
 *
 * Always includes a 'general' baseline profile covering all students.
 */
export function profileGroups(
  students: Studente[],
  explanations: Map<string, AIExplanation>,
): GroupProfile[] {
  const profiles: GroupProfile[] = [];

  // ── general baseline ─────────────────────────────────────────────────────
  profiles.push(buildProfile(
    'general',
    'Tutta la classe',
    'general',
    students.map(s => s.id),
    explanations,
  ));

  // ── BES ──────────────────────────────────────────────────────────────────
  const besIds = students.filter(s => s.hasBES).map(s => s.id);
  if (besIds.length > 0) {
    profiles.push(buildProfile('bes', 'Studenti BES', 'bes', besIds, explanations));
  }

  // ── DSA ──────────────────────────────────────────────────────────────────
  const dsaIds = students.filter(s => s.hasDSA).map(s => s.id);
  if (dsaIds.length > 0) {
    profiles.push(buildProfile('dsa', 'Studenti DSA', 'dsa', dsaIds, explanations));
  }

  // ── L.104 ────────────────────────────────────────────────────────────────
  const h104Ids = students.filter(s => s.has104).map(s => s.id);
  if (h104Ids.length > 0) {
    profiles.push(buildProfile('104', 'Studenti L.104', '104', h104Ids, explanations));
  }

  // ── support supergroup (BES | DSA | 104) ─────────────────────────────────
  const supportIds = students.filter(s => s.hasBES || s.hasDSA || s.has104).map(s => s.id);
  if (supportIds.length > 0) {
    profiles.push(buildProfile(
      'support',
      'Studenti con supporto (BES/DSA/104)',
      'support',
      supportIds,
      explanations,
    ));
  }

  // ── per-class ────────────────────────────────────────────────────────────
  const classeMap = new Map<string, string[]>();
  for (const s of students) {
    if (!s.classe) continue;
    const arr = classeMap.get(s.classe) ?? [];
    arr.push(s.id);
    classeMap.set(s.classe, arr);
  }
  // Only add per-class profiles when there are at least 2 distinct classes
  if (classeMap.size >= 2) {
    for (const [classe, ids] of classeMap) {
      profiles.push(buildProfile(
        `classe:${classe}`,
        `Classe ${classe}`,
        'classe',
        ids,
        explanations,
      ));
    }
  }

  return profiles;
}

/**
 * Returns the complementary (non-group) student ids for a given profile,
 * relative to a reference set of all students.
 * Used by disparateImpactDetector to compare group vs. non-group.
 */
export function complementIds(profile: GroupProfile, allStudentIds: string[]): string[] {
  const groupSet = new Set(profile.studentIds);
  return allStudentIds.filter(id => !groupSet.has(id));
}
