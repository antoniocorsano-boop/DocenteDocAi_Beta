/**
 * CapabilityEngine — pure function that computes CapabilityLevel + confidenceScore
 * from a TeacherModel snapshot.
 *
 * Promotion rules (source of truth: docs/architecture/teacher-cognitive-model.md):
 *   L1 → L2: lessons≥5, assessments≥3, copilotRequests≥3
 *   L2 → L3: analyticsViews≥5, udaCreated≥2, copilotRequests≥10, driveConnected=true
 *   L3 → L4: copilotRequests≥20, suggestionsAccepted≥10, automationEnabled=true
 *
 * confidenceScore: fraction of threshold criteria met (0.0–1.0).
 * A promotion is NOT applied if confidenceScore < 0.3.
 *
 * JourneyLevel mapping:   L1 → esploratore   L2–3 → praticante   L4 → maestro
 */

import type { TeacherModel, CapabilityLevel, JourneyLevel } from '../types/teacherModel.types';
import type { AppEvent } from './eventMap';

interface CapabilityResult {
  level: CapabilityLevel;
  confidence: number;
}

/** Criteria weights for each level transition */
const L1_TO_L2 = [
  (m: TeacherModel) => m.usageProfile.lessonsCreated >= 5,
  (m: TeacherModel) => m.usageProfile.assessmentsGenerated >= 3,
  (m: TeacherModel) => m.usageProfile.copilotRequests >= 3,
];

const L2_TO_L3 = [
  (m: TeacherModel) => m.usageProfile.analyticsViews >= 5,
  (m: TeacherModel) => m.usageProfile.udaCreated >= 2,
  (m: TeacherModel) => m.usageProfile.copilotRequests >= 10,
  (m: TeacherModel) => m.usageProfile.driveConnected,
];

const L3_TO_L4 = [
  (m: TeacherModel) => m.usageProfile.copilotRequests >= 20,
  (m: TeacherModel) => m.copilotInteractionProfile.suggestionsAccepted >= 10,
  (m: TeacherModel) => m.copilotInteractionProfile.automationEnabled,
];

/**
 * Soft signals from new events — improve globalConfidence but don't gate promotions.
 * These represent workspace integration & discovery, not core pedagogical capability.
 */
const BONUS_SIGNALS: ((m: TeacherModel) => boolean)[] = [
  (m) => (m.usageProfile.featuresDiscovered ?? 0) >= 3,
  (m) => m.usageProfile.workspaceConfigured ?? false,
  (m) => (m.usageProfile.bookServicesLinked ?? 0) >= 1,
];

function score(predicates: ((m: TeacherModel) => boolean)[], model: TeacherModel): number {
  if (predicates.length === 0) return 0;
  const met = predicates.filter((p) => p(model)).length;
  return met / predicates.length;
}

export function computeCapability(model: TeacherModel): CapabilityResult {
  const allCriteria = [...L1_TO_L2, ...L2_TO_L3, ...L3_TO_L4, ...BONUS_SIGNALS];
  const globalConfidence = score(allCriteria, model);

  // Determine the highest warranted level
  const l1to2 = score(L1_TO_L2, model);
  const l2to3 = score(L2_TO_L3, model);
  const l3to4 = score(L3_TO_L4, model);

  const CONFIDENCE_THRESHOLD = 0.3;

  let level: CapabilityLevel = 1;
  let _confidence = l1to2;

  if (l1to2 >= 1 && globalConfidence >= CONFIDENCE_THRESHOLD) {
    level = 2;
    _confidence = l2to3;
    if (l2to3 >= 1 && globalConfidence >= CONFIDENCE_THRESHOLD) {
      level = 3;
      _confidence = l3to4;
      if (l3to4 >= 1 && globalConfidence >= CONFIDENCE_THRESHOLD) {
        level = 4;
        _confidence = 1;
      }
    }
  }

  return { level, confidence: Math.round(globalConfidence * 100) / 100 };
}

/** Map internal CapabilityLevel to UX-facing JourneyLevel */
export function toJourneyLevel(level: CapabilityLevel): JourneyLevel {
  if (level === 4) return 'maestro';
  if (level >= 2) return 'praticante';
  return 'esploratore';
}

/** Progress within current JourneyLevel band (0.0–1.0, used by progress bar) */
export function computeJourneyProgress(model: TeacherModel): number {
  const current = model.capabilityLevel;
  if (current === 1) {
    return Math.min(score(L1_TO_L2, model), 0.99);
  }
  if (current === 2) {
    // praticante has 2 sub-levels: show progress toward L4
    const l2to3 = score(L2_TO_L3, model);
    return Math.min((l2to3 * 0.5), 0.99);
  }
  if (current === 3) {
    return Math.min(0.5 + score(L2_TO_L3, model) * 0.5, 0.99);
  }
  return 1; // maestro
}

// ── Feature Gating ───────────────────────────────────────────────────────────

/** Stable keys for features progressively unlocked by CapabilityLevel */
export type FeatureKey =
  | 'ADD_STUDENT'
  | 'CREATE_LESSON'
  | 'CREATE_UDA'
  | 'ARTISTIC_TOOLS'
  | 'BOOK_INTEGRATION';

const FEATURE_MAP: Record<CapabilityLevel, FeatureKey[]> = {
  1: ['ADD_STUDENT'],
  2: ['ADD_STUDENT', 'CREATE_LESSON'],
  3: ['ADD_STUDENT', 'CREATE_LESSON', 'CREATE_UDA', 'ARTISTIC_TOOLS'],
  4: ['ADD_STUDENT', 'CREATE_LESSON', 'CREATE_UDA', 'ARTISTIC_TOOLS', 'BOOK_INTEGRATION'],
};

/**
 * Returns the set of features available at a given CapabilityLevel.
 * Higher levels include all lower-level features (cumulative).
 */
export function getAvailableFeatures(level: CapabilityLevel): FeatureKey[] {
  return FEATURE_MAP[level] ?? FEATURE_MAP[1];
}

/**
 * Event-based capability level heuristic.
 *
 * Determines CapabilityLevel from a list of AppEvents based on milestone events.
 * Lighter-weight complement to computeCapability(model) for scenarios where
 * only an event log is available (e.g. onboarding, tests).
 *
 * Rules:
 *   L1 → default
 *   L2 → 'class.first_student_added' present
 *   L3 → 'workspace.configured' present
 *   L4 → 'book.service.interacted' present
 */
export function computeCapabilityLevel(events: AppEvent[]): CapabilityLevel {
  const names = new Set(events.map((e) => e.name as string));
  if (names.has('book.service.interacted')) return 4;
  if (names.has('workspace.configured')) return 3;
  if (names.has('class.first_student_added')) return 2;
  return 1;
}
