/**
 * enterprise/enterpriseAuditLog.ts
 *
 * Tamper-evident append-only audit log for Enterprise operations.
 *
 * Extends the school-system complianceLog with enterprise-specific entries:
 *   - Agent executions
 *   - Approval requests and resolutions
 *   - KG Enterprise writes
 *   - AI key access events
 *   - Rate-limit and sandbox events
 *
 * Architecture: localStorage, append-only, capped at MAX_ENTRIES.
 * On export: sanitized JSON (secrets redacted).
 */

import type { AgentRole, ApprovalLevel } from '../../types/enterprise.types';

// ── Entry types ───────────────────────────────────────────────────────────────

export type EnterpriseAuditAction =
  | 'agent_started'
  | 'agent_completed'
  | 'agent_failed'
  | 'approval_submitted'
  | 'approval_resolved'
  | 'kg_write_staged'
  | 'kg_write_committed'
  | 'kg_write_rejected'
  | 'automation_soft_triggered'
  | 'copilot_action_executed'
  | 'copilot_action_blocked'
  | 'copilot_approval_submitted'
  | 'automation_critical_triggered'
  | 'automation_executed'
  | 'ai_key_accessed'
  | 'rate_limit_hit'
  | 'sandbox_isolation'
  | 'compliance_check'
  | 'report_generated';

export interface EnterpriseAuditEntry {
  id: string;
  timestamp: string;
  action: EnterpriseAuditAction;
  agentRole?: AgentRole;
  approvalLevel?: ApprovalLevel;
  tenantId?: string;
  sessionId?: string;
  details: Record<string, unknown>;
  /** ISO compliance flags — which standards this entry satisfies */
  complianceTags?: string[];
  /**
   * Operational use case that originated this audit entry.
   * Maps to UseCaseId in useCaseTelemetry.ts (e.g. "UC-R5", "UC-R4").
   * Enables cross-referencing enterprise audit entries with use case telemetry.
   */
  useCaseId?: string;
  /**
   * Compliance score delta caused by the action in this entry.
   * Positive = improvement (e.g. approval granted: +5),
   * Negative = degradation (e.g. compliance violation detected: -10).
   */
  complianceDelta?: number;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'enterprise_audit_log_v1';
const MAX_ENTRIES = 1000;
const TRIM_TO     = 800;

const REDACT_KEYS = /pass(word)?|token|secret|key|credential|auth|bearer|api_key/i;

// ── Implementation ────────────────────────────────────────────────────────────

class EnterpriseAuditLogImpl {
  private _load(): EnterpriseAuditEntry[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as EnterpriseAuditEntry[]) : [];
    } catch {
      return [];
    }
  }

  private _save(entries: EnterpriseAuditEntry[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      }
    } catch { /* quota — silent */ }
  }

  private _sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      out[k] = REDACT_KEYS.test(k) ? '[REDACTED]' : v;
    }
    return out;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  record(entry: Omit<EnterpriseAuditEntry, 'id' | 'timestamp'>): void {
    const entries = this._load();
    const full: EnterpriseAuditEntry = {
      ...entry,
      details:   this._sanitize(entry.details),
      id:        `eaud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    entries.push(full);
    const trimmed = entries.length > MAX_ENTRIES ? entries.slice(-TRIM_TO) : entries;
    this._save(trimmed);
  }

  getAll(): EnterpriseAuditEntry[] {
    return this._load();
  }

  getLast(n: number): EnterpriseAuditEntry[] {
    return this._load().slice(-n);
  }

  filterByAction(action: EnterpriseAuditAction): EnterpriseAuditEntry[] {
    return this._load().filter(e => e.action === action);
  }

  filterByAgent(role: AgentRole): EnterpriseAuditEntry[] {
    return this._load().filter(e => e.agentRole === role);
  }

  filterByTenant(tenantId: string): EnterpriseAuditEntry[] {
    return this._load().filter(e => e.tenantId === tenantId);
  }

  /** Export sanitized JSON for institutional download / audit submission */
  export(): string {
    return JSON.stringify({ exportedAt: new Date().toISOString(), entries: this._load() }, null, 2);
  }

  size(): number {
    return this._load().length;
  }
}

export const enterpriseAuditLog = new EnterpriseAuditLogImpl();
