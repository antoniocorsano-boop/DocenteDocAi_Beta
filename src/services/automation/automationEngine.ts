/**
 * automation/automationEngine.ts — Autonomous Actions engine.
 *
 * CLIENT-SIDE ONLY: imports actionRouter which imports Zustand stores.
 * DO NOT import this module in api/ Edge Functions.
 *
 * Safety contract:
 *   - All store mutations go through routeDocumentIntent() from actionRouter.
 *   - Every trigger, execution, and error is logged to the execution log.
 *   - requiresConfirmation rules are queued and never executed without consent.
 *   - autoApproved flags are persisted to localStorage across sessions.
 */

import type {
  AutomationRule,
  AutomationTriggerPayload,
  AutomationExecution,
  ConfirmationRequest,
  ConfirmationAnswer,
  ConfirmationListener,
  ChatMessageListener,
} from './types';
import { routeDocumentIntent } from '../../integrations/chat/actionRouter';
import { useSystemStore } from '../../stores/useSystemStore';

// ─── Persistence keys ─────────────────────────────────────────────────────────

const LOG_KEY        = 'automation_log_v1';
const AUTO_APPROVE_KEY = 'automation_auto_approved_v1';
const PENDING_KEY    = 'automation_pending_v1';
/** Max log entries kept in localStorage. */
const MAX_LOG_SIZE = 200;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nanoid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function safeJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeStore(key: string, value: unknown): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch { /* quota or private browsing — silently skip */ }
}

// ─── Engine ───────────────────────────────────────────────────────────────────

class AutomationEngineImpl {
  /** In-memory rule registry — rebuilt on each page load from defaultRules.ts */
  private _rules: Map<string, AutomationRule> = new Map();

  /** Persisted execution log */
  private _log: AutomationExecution[] = safeJSON<AutomationExecution[]>(LOG_KEY, []);

  /** Persisted set of auto-approved rule IDs */
  private _autoApproved: Set<string> = new Set(
    safeJSON<string[]>(AUTO_APPROVE_KEY, []),
  );

  /** Persisted pending confirmation requests */
  private _pending: ConfirmationRequest[] = safeJSON<ConfirmationRequest[]>(PENDING_KEY, []);

  /** Observers notified when a new confirmation is enqueued */
  private _confirmListeners: ConfirmationListener[] = [];

  /** Observers notified when the engine emits a chat message */
  private _chatListeners: ChatMessageListener[] = [];

  // ── Rule management ────────────────────────────────────────────────────────

  register(rule: AutomationRule): void {
    // Merge runtime autoApproved state from localStorage into the rule
    const r = { ...rule, autoApproved: this._autoApproved.has(rule.id) || rule.autoApproved };
    this._rules.set(rule.id, r);
  }

  unregister(ruleId: string): void {
    this._rules.delete(ruleId);
  }

  enable(ruleId: string): void {
    const r = this._rules.get(ruleId);
    if (r) this._rules.set(ruleId, { ...r, enabled: true });
  }

  disable(ruleId: string): void {
    const r = this._rules.get(ruleId);
    if (r) this._rules.set(ruleId, { ...r, enabled: false });
  }

  getRules(): AutomationRule[] {
    return [...this._rules.values()];
  }

  // ── Observer registration ──────────────────────────────────────────────────

  onConfirmationRequired(listener: ConfirmationListener): () => void {
    this._confirmListeners.push(listener);
    return () => {
      this._confirmListeners = this._confirmListeners.filter((l) => l !== listener);
    };
  }

  onChatMessage(listener: ChatMessageListener): () => void {
    this._chatListeners.push(listener);
    return () => {
      this._chatListeners = this._chatListeners.filter((l) => l !== listener);
    };
  }

  // ── Trigger ────────────────────────────────────────────────────────────────

  /**
   * Fire an automation trigger. Evaluates all matching enabled rules
   * and either executes them immediately or enqueues confirmation requests.
   *
   * @param payload    - Trigger payload (discriminated union)
   * @param tenantId   - Active tenant ID; rules with a tenantId only fire when
   *                     their tenantId matches. Rules without tenantId always
   *                     match (backward-compatible).
   */
  async trigger(payload: AutomationTriggerPayload, tenantId?: string): Promise<void> {
    const matchingRules = [...this._rules.values()].filter(
      (r) =>
        r.enabled &&
        r.triggerType === payload.type &&
        (!r.tenantId || !tenantId || r.tenantId === tenantId),
    );

    for (const rule of matchingRules) {
      // Evaluate condition — never throws out to the engine
      let conditionMet = false;
      try {
        conditionMet = rule.condition(payload);
      } catch (e) {
        this._writeLog({
          id: nanoid(),
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredAt: new Date().toISOString(),
          payload,
          status: 'error',
          errorMessage: `Condition evaluation error: ${String(e)}`,
        });
        continue;
      }

      if (!conditionMet) {
        this._writeLog({
          id: nanoid(),
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredAt: new Date().toISOString(),
          payload,
          status: 'skipped',
        });
        continue;
      }

      // Check whether confirmation is needed
      const needsConfirm =
        rule.requiresConfirmation && !rule.autoApproved && !this._autoApproved.has(rule.id);

      if (needsConfirm) {
        await this._enqueueConfirmation(rule, payload);
      } else {
        const resolvedBy = this._autoApproved.has(rule.id) ? 'auto' : undefined;
        await this._execute(rule, payload, resolvedBy);
      }
    }
  }

  // ── Human-in-the-loop ─────────────────────────────────────────────────────

  getPendingConfirmations(): ConfirmationRequest[] {
    return [...this._pending];
  }

  /**
   * Answer a pending confirmation request.
   * - 'yes'    → execute once
   * - 'no'     → reject and log
   * - 'always' → mark rule as auto-approved, execute once
   */
  async answer(confirmationId: string, answer: ConfirmationAnswer): Promise<void> {
    const idx = this._pending.findIndex((p) => p.id === confirmationId);
    if (idx === -1) return;

    const req = this._pending[idx];
    this._pending.splice(idx, 1);
    this._savePending();

    const rule = this._rules.get(req.ruleId);
    if (!rule) return;

    const now = new Date().toISOString();

    if (answer === 'no') {
      // Update the log entry that was created at enqueue time
      this._patchLog(confirmationId, { status: 'rejected', resolvedAt: now, resolvedBy: 'user' });
      return;
    }

    if (answer === 'always') {
      // Mark auto-approved persistently
      this._autoApproved.add(rule.id);
      this._rules.set(rule.id, { ...rule, autoApproved: true });
      safeStore(AUTO_APPROVE_KEY, [...this._autoApproved]);
    }

    this._patchLog(confirmationId, {
      status: answer === 'always' ? 'auto_approved' : 'confirmed',
      resolvedAt: now,
      resolvedBy: 'user',
    });

    await this._execute(rule, req.payload, 'user', confirmationId);
  }

  // ── Log access ─────────────────────────────────────────────────────────────

  getLog(): AutomationExecution[] {
    return [...this._log];
  }

  clearLog(): void {
    this._log = [];
    safeStore(LOG_KEY, []);
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private async _execute(
    rule: AutomationRule,
    payload: AutomationTriggerPayload,
    resolvedBy?: 'user' | 'auto',
    existingLogId?: string,
  ): Promise<void> {
    const execId = existingLogId ?? nanoid();
    const now = new Date().toISOString();

    // Log analytics event before execution
    try {
      useSystemStore.getState().actions.trackAnalyticsEvent(
        'feature_usage',
        'automation_execute',
        { ruleId: rule.id, ruleName: rule.name, triggerType: payload.type },
      );
    } catch { /* non-critical */ }

    if (rule.action.type === 'log_only') {
      this._writeLog({
        id: execId,
        ruleId: rule.id,
        ruleName: rule.name,
        triggeredAt: now,
        payload,
        status: 'executed',
        resolvedBy,
      });
      return;
    }

    if (rule.action.type === 'send_chat_message') {
      const msg = _interpolate(rule.action.template, payload);
      this._emitChatMessage(msg);
      this._writeLog({
        id: execId,
        ruleId: rule.id,
        ruleName: rule.name,
        triggeredAt: now,
        payload,
        status: 'executed',
        resolvedBy,
      });
      return;
    }

    // route_document_intent — only valid for document_processed payloads
    if (rule.action.type === 'route_document_intent') {
      if (payload.type !== 'document_processed') {
        this._writeLog({
          id: execId,
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredAt: now,
          payload,
          status: 'error',
          errorMessage: 'route_document_intent requires document_processed trigger',
          resolvedBy,
        });
        return;
      }

      let result;
      try {
        result = await routeDocumentIntent(payload.data.intent);
      } catch (e) {
        this._writeLog({
          id: execId,
          ruleId: rule.id,
          ruleName: rule.name,
          triggeredAt: now,
          payload,
          status: 'error',
          errorMessage: String(e),
          resolvedBy,
        });
        return;
      }

      this._writeLog({
        id: execId,
        ruleId: rule.id,
        ruleName: rule.name,
        triggeredAt: now,
        payload,
        status: 'executed',
        result,
        resolvedBy,
      });

      // Emit result as chat message
      const statusIcon = result.ok ? '✅' : '⚠️';
      this._emitChatMessage(`${statusIcon} [Auto] ${result.message}`);
    }
  }

  private async _enqueueConfirmation(
    rule: AutomationRule,
    payload: AutomationTriggerPayload,
  ): Promise<void> {
    const id = nanoid();
    const req: ConfirmationRequest = {
      id,
      ruleId: rule.id,
      ruleName: rule.name,
      description: rule.description,
      createdAt: new Date().toISOString(),
      chatMessage: _buildConfirmMessage(rule, payload),
      payload,
    };

    this._pending.push(req);
    this._savePending();

    // Log the pending state
    this._writeLog({
      id,
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredAt: req.createdAt,
      payload,
      status: 'pending_confirmation',
    });

    // Notify listeners (e.g. chat UI)
    for (const l of this._confirmListeners) {
      try { l(req); } catch { /* listener errors must not break the engine */ }
    }
  }

  private _writeLog(entry: AutomationExecution): void {
    this._log.push(entry);
    // Keep log bounded
    if (this._log.length > MAX_LOG_SIZE) {
      this._log = this._log.slice(-MAX_LOG_SIZE);
    }
    safeStore(LOG_KEY, this._log);
  }

  private _patchLog(id: string, patch: Partial<AutomationExecution>): void {
    const idx = this._log.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this._log[idx] = { ...this._log[idx], ...patch };
      safeStore(LOG_KEY, this._log);
    }
  }

  private _savePending(): void {
    safeStore(PENDING_KEY, this._pending);
  }

  private _emitChatMessage(msg: string): void {
    for (const l of this._chatListeners) {
      try { l(msg); } catch { /* ignore */ }
    }
  }
}

// ─── Template interpolation ────────────────────────────────────────────────────

/**
 * Simple {{key}} substitution for chat message templates.
 * Supported keys: {{triggerType}}, {{confidence}}, {{documentType}}, {{action}}
 */
function _interpolate(template: string, payload: AutomationTriggerPayload): string {
  const vars: Record<string, string> = {
    triggerType: payload.type,
  };

  if (payload.type === 'document_processed') {
    vars['confidence'] = `${Math.round(payload.data.ocrConfidence * 100)}%`;
    vars['documentType'] = payload.data.intent.document.type;
    vars['action'] = payload.data.intent.action;
  }
  if (payload.type === 'assessment_created') {
    vars['grade'] = String(payload.data.grade);
    vars['materia'] = payload.data.materia;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? `{{${k}}}`);
}

function _buildConfirmMessage(rule: AutomationRule, payload: AutomationTriggerPayload): string {
  let context = '';

  if (payload.type === 'document_processed') {
    const { intent, ocrConfidence } = payload.data;
    context =
      `\n📄 Documento: \`${intent.document.type}\`` +
      `\n🎯 Azione rilevata: \`${intent.action}\`` +
      `\n📊 Confidenza OCR: ${Math.round(ocrConfidence * 100)}%`;
  }
  if (payload.type === 'assessment_created') {
    context = `\n📝 Voto ${payload.data.grade} in ${payload.data.materia}`;
  }

  return (
    `🤖 *Automazione: ${rule.name}*\n` +
    `${rule.description}${context}\n\n` +
    `Vuoi procedere?\n` +
    `• Rispondi *SÌ* per eseguire\n` +
    `• Rispondi *NO* per saltare\n` +
    `• Rispondi *SEMPRE* per approvare automaticamente in futuro`
  );
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const automationEngine = new AutomationEngineImpl();
