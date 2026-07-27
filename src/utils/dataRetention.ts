/**
 * dataRetention.ts
 *
 * Data-retention utility — GDPR B4.
 *
 * Policy: every time the user opens the app we record a "last active" timestamp.
 * On the next boot, if that timestamp is older than RETENTION_DAYS, we clear
 * AI-generated data (telemetry buffer, audit trail, AI snapshots) but do NOT
 * touch the teacher's primary data (lessons, students, evaluations, UDAs).
 *
 * Primary data is never auto-deleted — only the derived AI artefacts are.
 *
 * Keys managed by this module:
 *   app_last_active     — ISO timestamp of last app open
 *   ai_audit_trail      — set by auditTrail.ts
 *   telemetry_buffer    — set by aiTelemetry.ts (if any)
 *   pa_readiness_v1     — checklist state (checklist, not personal data)
 */

const LAST_ACTIVE_KEY = 'app_last_active';
const RETENTION_DAYS  = 365;

/** Keys containing AI-generated / derived data that expire after RETENTION_DAYS. */
const EXPIRING_KEYS = [
  'ai_audit_trail',
  'telemetry_buffer',
  // Add more as new AI features persist data in localStorage
] as const;

/** Record the current timestamp as the last-active marker. */
export function touchLastActive(): void {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, new Date().toISOString());
  } catch {
    /* quota or private-mode — ignore */
  }
}

/**
 * Run at app boot. If the last-active timestamp is older than RETENTION_DAYS,
 * purge all expiring AI data keys and reset the last-active marker.
 *
 * @returns true if a retention sweep was performed.
 */
export function runRetentionCheck(): boolean {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!raw) {
      // First ever run — just touch and return
      touchLastActive();
      return false;
    }

    const lastActive = new Date(raw);
    const daysSince = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince < RETENTION_DAYS) {
      touchLastActive();
      return false;
    }

    // Expired — clear AI artefacts
    EXPIRING_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    });

    touchLastActive();
    return true;
  } catch {
    return false;
  }
}

/**
 * Immediately purge all AI-derived data (callable from Settings → Privacy → "Cancella dati AI").
 * Does NOT touch primary teacher data (lessons, students, evaluations, UDAs).
 */
export function purgeAIData(): void {
  EXPIRING_KEYS.forEach(key => {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  });
}

/** Returns the last-active date, or null if never set. */
export function getLastActive(): Date | null {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_KEY);
    return raw ? new Date(raw) : null;
  } catch {
    return null;
  }
}
