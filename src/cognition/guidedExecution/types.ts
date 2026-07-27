/**
 * guidedExecution/types.ts — Guided Execution System core types.
 *
 * When a user accepts a suggested action, the system builds an ExecutionPlan
 * and enters "Guided Mode": a non-blocking, step-by-step UI layer that
 * reduces cognitive load to zero by highlighting only what matters now.
 */

/**
 * A single step within a guided execution flow.
 */
export interface ExecutionStep {
  /** Stable identifier — used for completion tracking */
  id: string;
  /** Short action label shown in the molecular tree (e.g. "Inserisci nome classe") */
  label: string;
  /** One-sentence instruction shown in the overlay */
  instruction: string;
  /** Material Symbols icon */
  icon: string;
  /** If set, the system navigates to this view when this step becomes active */
  targetView?: string;
  /**
   * CSS querySelector hint for the element to visually emphasise.
   * If null, the system falls back to a generic "look around" hint.
   */
  targetElementHint?: string;
}

/**
 * A full execution plan produced for a single NextAction.
 */
export interface ExecutionPlan {
  /** Maps to the originating NextAction.id */
  actionId: string;
  /** Display name for the overall goal (e.g. "Aggiungi la tua classe") */
  actionLabel: string;
  /** Ordered list of steps the user must complete */
  steps: ExecutionStep[];
}

/**
 * Minimal UI hints emitted for the currently active step.
 * Consumed by GuidedStepOverlay to know what to highlight / say.
 */
export interface StepUIHints {
  stepLabel: string;
  stepInstruction: string;
  stepIcon: string;
  /** Resolved element to highlight (null if not found / not applicable) */
  targetElement: Element | null;
  stepIndex: number;
  totalSteps: number;
}
