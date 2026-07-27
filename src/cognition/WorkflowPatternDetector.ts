/**
 * WorkflowPatternDetector — intra-session workflow analysis (3h window, max 10 events).
 *
 * Listens to CognitionBus events, maintains a rolling session buffer, and
 * detects known multi-step workflow sequences defined in eventMap.ts.
 *
 * When a pattern is detected, it writes/updates a WorkflowPattern entry
 * in the TeacherModel store.
 */

import { cognitionBus, CognitionEvents } from './CognitionBus';
import type { WorkflowPattern } from '../types/teacherModel.types';

const WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours
const MAX_BUFFER = 10;

/** Known workflow patterns (sequence = minimum required events in order) */
const KNOWN_PATTERNS: { id: string; sequence: (keyof CognitionEvents)[] }[] = [
  {
    id: 'lessonWorkflow',
    sequence: ['lesson.created', 'attendance.recorded'],
  },
  {
    id: 'assessmentWorkflow',
    sequence: ['assessment.generated', 'evaluation.added'],
  },
  {
    id: 'planningWorkflow',
    sequence: ['uda.created', 'planning.wizard.completed'],
  },
  {
    id: 'analysisWorkflow',
    sequence: ['analytics.viewed', 'copilot.manual_prompt'],
  },
  {
    id: 'driveWorkflow',
    sequence: ['drive.connected', 'drive.backup.saved'],
  },
  {
    id: 'onboardingWorkflow',
    sequence: ['app.session.started', 'workspace.configured'],
  },
  {
    id: 'integrationWorkflow',
    sequence: ['book.account.linked', 'book.service.interacted'],
  },
];

interface SessionEvent {
  name: keyof CognitionEvents;
  ts: number;
}

export interface WorkflowStore {
  addWorkflowPattern: (pattern: Omit<WorkflowPattern, 'occurrences'> & { occurrences?: number }) => void;
  getWorkflowPatterns: () => WorkflowPattern[];
}

let sessionBuffer: SessionEvent[] = [];
let initialized = false;

function pruneBuffer(): void {
  const cutoff = Date.now() - WINDOW_MS;
  sessionBuffer = sessionBuffer.filter((e) => e.ts >= cutoff).slice(-MAX_BUFFER);
}

function detectPatterns(store: WorkflowStore): void {
  const names = sessionBuffer.map((e) => e.name);
  for (const { id, sequence } of KNOWN_PATTERNS) {
    // Check if all required events appear in order in the buffer
    let idx = 0;
    for (const name of names) {
      if (name === sequence[idx]) idx++;
      if (idx === sequence.length) break;
    }
    if (idx < sequence.length) continue;

    // Pattern detected — update store
    const existing = store.getWorkflowPatterns().find((p) => p.patternId === id);
    store.addWorkflowPattern({
      patternId: id,
      sequence: sequence as string[],
      occurrences: (existing?.occurrences ?? 0) + 1,
      lastDetected: Date.now(),
    });
  }
}

function track(name: keyof CognitionEvents, store: WorkflowStore): void {
  pruneBuffer();
  sessionBuffer.push({ name, ts: Date.now() });
  detectPatterns(store);
}

const TRACKED_EVENTS: (keyof CognitionEvents)[] = [
  'lesson.created',
  'attendance.recorded',
  'assessment.generated',
  'evaluation.added',
  'uda.created',
  'planning.wizard.completed',
  'analytics.viewed',
  'copilot.manual_prompt',
  'drive.connected',
  'drive.backup.saved',
  'app.session.started',
  'workspace.configured',
  'class.first_student_added',
  'student.added',
  'book.account.linked',
  'book.service.interacted',
  'feature.discovered',
];

/** Call once at app startup. Idempotent. */
export function initWorkflowPatternDetector(store: WorkflowStore): void {
  if (initialized) return;
  initialized = true;

  for (const event of TRACKED_EVENTS) {
    cognitionBus.on(event, () => track(event, store));
  }
}

/** Reset for testing only */
export function _resetWorkflowDetector(): void {
  initialized = false;
  sessionBuffer = [];
}
