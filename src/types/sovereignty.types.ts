/**
 * sovereignty.types.ts — Layer Zero: Operational Sovereignty
 *
 * Defines structural types for user operational control over the AI system.
 *
 * Compliance mapping:
 *   SystemMode            → AI Act Art. 14 (human oversight requirement)
 *                         → AgID (continuità operativa — sistema funziona senza AI)
 *   UserSovereigntyConfig → GDPR Art. 5(1)(a) (trasparenza e consenso)
 *                         → GDPR Art. 25 (privacy by design and by default)
 */

// ─── Operational mode ────────────────────────────────────────────────────────

/**
 * Defines the level of AI involvement in system operations.
 *
 * - offline_only:   No AI processing. All functionality uses local logic only.
 *                   Recommended for PA environments with strict data restrictions.
 * - assistive_ai:   AI suggests, human decides. Every AI action requires explicit
 *                   approval before execution (human-in-the-loop).
 * - autonomous_ai:  AI executes autonomously within defined limits for low-risk
 *                   actions. High-risk actions still require approval.
 */
export type SystemMode =
  | 'offline_only'
  | 'assistive_ai'
  | 'autonomous_ai';

// ─── Data sharing configuration ───────────────────────────────────────────────

export interface DataSharingConfig {
  /** Internal usage telemetry (UC events, performance metrics). No personal data. */
  telemetry: boolean;
  /** Compliance audit log entries for operational traceability (AgID + AI Act Art. 17). */
  audit: boolean;
  /** Anonymised aggregate open data publication (DCAT-AP_IT format). */
  openData: boolean;
}

// ─── Personalisation configuration ───────────────────────────────────────────

export interface PersonalizationConfig {
  /** Keep all personalisation data only in the local browser. Never sync externally. */
  localOnly: boolean;
  /**
   * Allow adaptive learning from interaction history (userBehaviorModel).
   * When enabled, the system adjusts ranking based on past actions.
   */
  adaptiveLearning: boolean;
}

// ─── Main sovereignty config ──────────────────────────────────────────────────

/**
 * Complete sovereignty configuration for a user.
 * Persisted under localStorage key 'sovereignty_config_v1'.
 */
export interface UserSovereigntyConfig {
  /** Operational mode — determines AI involvement level. */
  mode: SystemMode;
  /**
   * Master AI kill-switch. When false, effective mode is always 'offline_only'
   * regardless of the `mode` field.
   */
  aiEnabled: boolean;
  /** What data the user consents to sharing or logging. */
  dataSharing: DataSharingConfig;
  /** Personalisation preferences. */
  personalization: PersonalizationConfig;
  /**
   * ISO 8601 timestamp of the last consent update.
   * Empty string means the user has not yet completed sovereignty onboarding.
   */
  lastConsentUpdate: string;
}
