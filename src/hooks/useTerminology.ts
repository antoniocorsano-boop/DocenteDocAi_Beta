/**
 * useTerminology — adaptive terminology hook.
 *
 * Returns display labels that adapt to the teacher's CapabilityLevel.
 * Core principle: avoid internal jargon ("UDA") at early stages.
 *
 * Rules:
 *   level < 3 (esploratore, praticante) → udaLabel = 'Lezione'
 *   level >= 3                          → udaLabel = 'UDA'
 */

import { useMemo } from 'react';
import { useTeacherModelStore } from '../stores/useTeacherModelStore';
import type { CapabilityLevel } from '../types/teacherModel.types';

export interface AppTerminology {
  /** 'Lezione' for level < 3, 'UDA' for level >= 3 */
  udaLabel: string;
  /** Plural form: 'Lezioni' or 'UDA' */
  udaLabelPlural: string;
  /** 'Crea Lezione' or 'Crea UDA' */
  createUdaLabel: string;
  /** Lesson / activity label for contextual display */
  lessonLabel: string;
  /** Assessment label — unchanged across levels */
  assessmentLabel: string;
}

function terminologyForLevel(level: CapabilityLevel): AppTerminology {
  const isAdvanced = level >= 3;
  return {
    udaLabel:        isAdvanced ? 'UDA'          : 'Lezione',
    udaLabelPlural:  isAdvanced ? 'UDA'          : 'Lezioni',
    createUdaLabel:  isAdvanced ? 'Crea UDA'     : 'Crea una lezione',
    lessonLabel:     'Lezione',
    assessmentLabel: 'Valutazione',
  };
}

/**
 * Returns display terminology adapted to the current CapabilityLevel.
 * Memoized — only re-runs when the capability level changes.
 */
export function useTerminology(): AppTerminology {
  const capabilityLevel = useTeacherModelStore((s) => s.capabilityLevel);
  return useMemo(() => terminologyForLevel(capabilityLevel), [capabilityLevel]);
}

/**
 * Pure helper for non-React contexts (e.g. tests, utility functions).
 */
export function getTerminology(level: CapabilityLevel): AppTerminology {
  return terminologyForLevel(level);
}
