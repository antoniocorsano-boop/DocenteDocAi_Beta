/**
 * types/uiBlocks.ts — P37 Smart Conversational UI Block Types (v2)
 *
 * Discriminated union of all structured block types rendered inside the
 * SmartChat message feed.  Each block variant carries the minimum data needed
 * for its renderer — no logic lives here.
 *
 * Base variants (P36.5):
 *   text     — plain markdown text
 *   plan     — numbered action plan
 *   actions  — clickable agent-execution buttons
 *   insight  — explainability panel
 *   status   — small one-line informational bar
 *
 * New variants (P37):
 *   form     — rendered form driven by FormSchema
 *   table    — MUI Table with columns + rows
 *   chart    — Recharts-based data visualization
 *   sandbox  — secure sandboxed HTML/code preview
 *   timeline — chronological event list
 */

// ── Action (shared by plan + actions blocks) ──────────────────────────────────

export interface UIAction {
  /** Button label shown to the user */
  label:    string;
  /** Agent ID to invoke when clicked (matches AgentManager registry) */
  agentId:  string;
  /** Optional hint for the action (shown as tooltip) */
  hint?:    string;
  /**
   * P40 — Trust signal: why this action is suggested.
   * Rendered as a small caption below the action button.
   * Example: "Suggerito perché stai lavorando su una lezione"
   */
  reason?:  string;
}

// ── Insight data (explainability) ─────────────────────────────────────────────

export interface UIInsightData {
  /** Agent IDs that executed in this run */
  agentsUsed:    string[];
  /** Composite confidence score [0, 1] */
  confidence:    number;
  /** Whether memory was retrieved and injected */
  memoryUsed:    boolean;
  /** Memory snippets shown to user (truncated) */
  memoryItems:   string[];
  /** Intent type detected by IntentEngine */
  intentType:    string;
  /** Wall-clock duration of the full run */
  durationMs:    number;
  /** Mode that was active for this run */
  mode:          string;
  /** Adaptive info — which agents were preferred/avoided */
  adaptiveHints: string[];
}

// ── Status data ───────────────────────────────────────────────────────────────

export interface UIStatusData {
  /** Short descriptive label */
  label:    string;
  /** Severity level for colour coding */
  severity: 'info' | 'success' | 'warning' | 'error';
  /** Optional extra detail string */
  detail?:  string;
}

// ── Form block types (P37) ────────────────────────────────────────────────────

export interface FormField {
  name:          string;
  label:         string;
  type:          'text' | 'number' | 'select' | 'textarea' | 'date';
  required?:     boolean;
  options?:      Array<{ value: string; label: string }>;
  placeholder?:  string;
  defaultValue?: string | number;
}

export interface FormSchema {
  title?:       string;
  fields:       FormField[];
  submitLabel?: string;
  /** Action ID dispatched via ActionBridge on submit */
  actionId:     string;
}

// ── Table block type (P37) ────────────────────────────────────────────────────

export interface TableConfig {
  columns:  string[];
  rows:     Array<Record<string, unknown>>;
  caption?: string;
}

// ── Chart block type (P37) ────────────────────────────────────────────────────

export interface ChartDataPoint {
  name:  string;
  value: number;
  [key: string]: unknown;
}

export interface ChartConfig {
  chartType: 'bar' | 'line' | 'pie' | 'area';
  data:      ChartDataPoint[];
  xKey?:     string;
  yKeys?:    string[];
  title?:    string;
  colors?:   string[];
}

// ── Sandbox block type (P37) ──────────────────────────────────────────────────

export interface SandboxConfig {
  html?:     string;
  code?:     string;
  language?: string;
}

// ── Timeline block type (P37) ─────────────────────────────────────────────────

export interface TimelineEvent {
  date:         string;
  title:        string;
  description?: string;
  type?:        'info' | 'success' | 'warning' | 'error';
}

// ── Message metadata (P37) ────────────────────────────────────────────────────

export interface MessageMetadata {
  source?:   'ui' | 'chat' | 'system';
  actionId?: string;
}

// ── UIBlock discriminated union ────────────────────────────────────────────────

export type UIBlock =
  // ── P36.5 base variants ───────────────────────────────────────────────────
  | { type: 'text';     content:  string }
  | { type: 'plan';     steps:    string[] }
  | { type: 'actions';  actions:  UIAction[] }
  | { type: 'insight';  data:     UIInsightData }
  | { type: 'status';   data:     UIStatusData }
  // ── P37 new variants ──────────────────────────────────────────────────────
  | { type: 'form';     schema:   FormSchema }
  | { type: 'table';    config:   TableConfig }
  | { type: 'chart';    config:   ChartConfig }
  | { type: 'sandbox';  config:   SandboxConfig }
  | { type: 'timeline'; events:   TimelineEvent[] }
  // ── P40 Trust Layer ───────────────────────────────────────────────────────
  /**
   * explain — lightweight explainability block.
   * Renders a collapsible "Perché questa risposta?" panel with
   * a list of natural-language reason strings.
   */
  | { type: 'explain';     items:    string[] }
  /**
   * P41 — confidence block: shows score [0-1] + contributing factor strings.
   * Rendered as a thin progress bar with optional factor list.
   */
  | { type: 'confidence';  score:    number; factors: string[] }
  /**
   * P42 — decision_card: unified block that collapses actions + explain + confidence
   * into a single cohesive experience.
   *
   * ONE ACTION RULE: `primaryAction` is the single prominent CTA.
   * `nextAction` (from ConfidenceEngine) overrides its label based on score:
   *   score < 0.50  → 'Raffina richiesta'  (low confidence, redirect)
   *   score ≥ 0.80  → 'Applica subito'     (high confidence, immediate action)
   */
  | {
      type:             'decision_card';
      primaryAction:    UIAction;
      secondaryActions: UIAction[];
      explainItems?:    string[];
      confidence?:      { score: number; factors: string[] };
      /** Confidence-driven label override for the primary CTA */
      nextAction?:      string;
    }
  /**
   * P43 — orbit_plan: AI-inferred action plan injected inline before orchestrator response.
   * Shows a numbered step list + confidence bar + "Avvia" CTA.
   * Non-blocking: user can ignore or dismiss without affecting the main response.
   */
  | {
      type:            'orbit_plan';
      title:           string;
      steps:           Array<{ id: string; label: string; action?: () => void; autoExecutable?: boolean }>;
      confidence:      number;
      /** Domain intent label for the badge (e.g. "Verifica", "Lezione") */
      intentLabel?:    string;
      /** Structured execution prompt — sent to orchestrator on Avvia click */
      executionPrompt?: string;
    }
  /**
   * P43 — work_session: unified block that collapses plan + confidence + explain + actions
   * into a single focused experience.
   *
   * ONE TASK RULE: shows the current task, ONE primary CTA, and progressive disclosure
   * for secondary actions and explain items.
   */
  | {
      type:               'work_session';
      title:              string;
      currentTask:        string;
      /** Primary CTA label (confidence-driven via ConfidenceEngine.nextAction) */
      nextAction:         string;
      confidence:         number;
      explainItems?:      string[];
      secondaryActions?:  UIAction[];
    };

// ── P38.6: AdaptedBlock — UIBlock augmented with soft density flag ─────────────

/**
 * UIBlock augmented with an optional hidden flag set by adaptBlocks().
 * The UI collapses hidden blocks behind a reveal button — no content is discarded.
 */
export type AdaptedBlock = UIBlock & { hidden?: boolean };

// ── Chat message ──────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id:        string;
  role:      MessageRole;
  /** Raw text for user messages; structured blocks for assistant messages */
  content:   string;
  /** Structured UI blocks — present only on assistant messages */
  blocks?:   UIBlock[];
  /** Timestamp (ms since epoch) */
  timestamp: number;
  /** True when this message was generated in deep/manual mode */
  isDeep?:   boolean;
  /** Origin metadata injected by ActionBridge (P37) */
  metadata?: MessageMetadata;
}
