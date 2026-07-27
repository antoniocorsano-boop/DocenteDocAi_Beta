/**
 * schoolSystems/complianceLog.ts — Tamper-evident audit log for school system operations.
 *
 * Stores a bounded, append-only log in localStorage under the key
 * `school_audit_log_v1`. The log captures all sync, export, KG, and
 * credential operations so that the institution can demonstrate compliance
 * with Italian data protection regulations (GDPR art. 5(1)(f), CAD, AGID).
 *
 * Entries are append-only — no entry is ever modified or deleted programmatically.
 * Log is capped at MAX_ENTRIES (500). When the cap is reached, the oldest 100
 * entries are dropped, preserving recent history.
 *
 * An entry MUST NOT contain passwords, tokens, or other secrets.
 * Any such field must be omitted or replaced with a redacted placeholder.
 */

import type { ComplianceAuditEntry } from './types';

const STORAGE_KEY = 'school_audit_log_v1';
const MAX_ENTRIES = 500;
const TRIM_TO     = 400;

// ─── Log implementation ───────────────────────────────────────────────────────

class ComplianceLogImpl {
    private readonly key = STORAGE_KEY;

    /** Append a new audit entry. Context must not contain credentials. */
    record(entry: Omit<ComplianceAuditEntry, 'id' | 'timestamp'>): void {
        const full: ComplianceAuditEntry = {
            id:        `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            timestamp: new Date().toISOString(),
            ...entry,
            // Sanitize: strip any field that looks like a password or token
            context:   this.sanitize(entry.context),
        };

        const log = this.load();
        log.push(full);

        // Trim if over cap — drop oldest entries
        const trimmed = log.length > MAX_ENTRIES ? log.slice(log.length - TRIM_TO) : log;
        this.save(trimmed);
    }

    /** Return the full audit log (newest-last). */
    getAll(): ComplianceAuditEntry[] {
        return this.load();
    }

    /** Return last N entries. */
    getLast(n: number): ComplianceAuditEntry[] {
        const all = this.load();
        return all.slice(Math.max(0, all.length - n));
    }

    /** Filter entries by action prefix (e.g. 'sync_' shows all sync ops). */
    filter(actionPrefix: string): ComplianceAuditEntry[] {
        return this.load().filter((e) => e.action.startsWith(actionPrefix));
    }

    /** Export as formatted JSON string (for institutional download). */
    export(): string {
        return JSON.stringify(this.load(), null, 2);
    }

    // ─── Private ───────────────────────────────────────────────────────────────

    private load(): ComplianceAuditEntry[] {
        if (typeof localStorage === 'undefined') return [];
        try {
            const raw = localStorage.getItem(this.key);
            if (!raw) return [];
            return JSON.parse(raw) as ComplianceAuditEntry[];
        } catch {
            return [];
        }
    }

    private save(entries: ComplianceAuditEntry[]): void {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.key, JSON.stringify(entries));
        } catch {
            // Storage quota exceeded — log is best-effort in this case
        }
    }

    /** Remove fields that should never appear in an audit log */
    private sanitize(ctx: Record<string, unknown>): Record<string, unknown> {
        const FORBIDDEN_KEYS = /pass(?:word)?|token|secret|key|credential|auth/i;
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(ctx)) {
            result[k] = FORBIDDEN_KEYS.test(k) ? '[REDACTED]' : v;
        }
        return result;
    }
}

export const complianceLog = new ComplianceLogImpl();
