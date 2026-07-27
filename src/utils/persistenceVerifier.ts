/**
 * persistenceVerifier.ts — C17: Verifica che tutti i layer di persistenza
 * (audit trail, telemetry, compliance, sovereignty) siano funzionanti.
 *
 * Funziona interamente via localStorage per non richiedere hooks React.
 * Usabile sia da componenti che da script di diagnostica.
 */

import { getAllEvents }          from '../cognition/useCaseTelemetry';
import { enterpriseAuditLog }   from '../services/enterprise/enterpriseAuditLog';
import { slog }                 from './structuredLogger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PersistenceLayerStatus = 'ok' | 'empty' | 'missing' | 'error';

export interface PersistenceLayerReport {
  layer:      string;
  storageKey: string;
  status:     PersistenceLayerStatus;
  entryCount?: number;
  sizeBytes?:  number;
  lastEntry?:  string; // ISO timestamp of the latest entry if detectable
  note?:       string;
}

export interface PersistenceVerificationReport {
  timestamp:  string;
  allOk:      boolean;
  layers:     PersistenceLayerReport[];
  warnings:   string[];
  errors:     string[];
}

// ─── Layer descriptors ────────────────────────────────────────────────────────

const PERSISTENCE_LAYERS = [
  { layer: 'Audit Trail Aziendale', storageKey: 'enterprise_audit_log_v1' },
  { layer: 'UC Telemetry',          storageKey: 'uc_telemetry_v1' },
  { layer: 'Compliance Database',   storageKey: 'compliance_db_v1' },
  { layer: 'Audit Trail PA',        storageKey: 'docente-doc-audit-trail' },
  { layer: 'Sovereignty Config',    storageKey: 'sovereignty_config_v1' },
  { layer: 'Structured Logs',       storageKey: 'structured_logs_v1' },
  { layer: 'Feature Flags',         storageKey: 'feature_flags_v1' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkLocalStorageLayer(storageKey: string, layerName: string): PersistenceLayerReport {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) {
      return { layer: layerName, storageKey, status: 'missing', note: 'Chiave non trovata in localStorage' };
    }
    const sizeBytes = new Blob([raw]).size;
    try {
      const parsed = JSON.parse(raw);
      const entryCount = Array.isArray(parsed) ? parsed.length
        : typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length
        : 1;

      // Try to detect last timestamp from array of objects
      let lastEntry: string | undefined;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const last = parsed[parsed.length - 1];
        if (last && typeof last === 'object') {
          lastEntry = (last as Record<string, unknown>).timestamp as string
            ?? (last as Record<string, unknown>).createdAt as string
            ?? (last as Record<string, unknown>).date as string;
        }
      }

      return {
        layer: layerName,
        storageKey,
        status: entryCount === 0 ? 'empty' : 'ok',
        entryCount,
        sizeBytes,
        lastEntry,
      };
    } catch {
      return { layer: layerName, storageKey, status: 'error', sizeBytes, note: 'JSON non valido' };
    }
  } catch (e) {
    return { layer: layerName, storageKey, status: 'error', note: String(e) };
  }
}

// ─── Main verification function ───────────────────────────────────────────────

/**
 * Verifica tutti i layer di persistenza.
 * Non modifica alcun dato — solo lettura.
 */
export function verifyPersistence(): PersistenceVerificationReport {
  const layers: PersistenceLayerReport[] = PERSISTENCE_LAYERS.map(({ layer, storageKey }) =>
    checkLocalStorageLayer(storageKey, layer),
  );

  const warnings: string[] = [];
  const errors:   string[] = [];

  for (const l of layers) {
    if (l.status === 'missing') {
      // Missing sovereignty or compliance = warning (not error — could be first boot)
      const msg = `[${l.layer}] Layer non inizializzato (chiave: ${l.storageKey})`;
      if (l.storageKey === 'enterprise_audit_log_v1' || l.storageKey === 'uc_telemetry_v1' || l.storageKey === 'compliance_db_v1') {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
    } else if (l.status === 'empty') {
      warnings.push(`[${l.layer}] Layer inizializzato ma vuoto`);
    } else if (l.status === 'error') {
      errors.push(`[${l.layer}] Errore di lettura: ${l.note ?? 'sconosciuto'}`);
    }
  }

  // Cross-check: audit trail entries vs in-memory singleton
  try {
    const inMemoryEntries     = enterpriseAuditLog.getAll();
    const auditLayer          = layers.find((l) => l.storageKey === 'enterprise_audit_log_v1');
    const inMemoryCount       = inMemoryEntries.length;
    const persistedCount      = auditLayer?.entryCount ?? 0;

    if (Math.abs(inMemoryCount - persistedCount) > 5) {
      warnings.push(
        `[Audit Trail] Discrepanza: ${inMemoryCount} in memoria vs ${persistedCount} persistiti`,
      );
    }
  } catch {
    warnings.push('[Audit Trail] Impossibile verificare la consistenza in-memory vs localStorage');
  }

  // Cross-check: telemetry
  try {
    const events  = getAllEvents();
    const telLayer = layers.find((l) => l.storageKey === 'uc_telemetry_v1');
    if (telLayer?.status === 'ok' && events.length === 0) {
      warnings.push('[UC Telemetry] In-memory vuoto ma localStorage ha dati — possibile reset non previsto');
    }
  } catch {
    /* best effort */
  }

  const allOk = errors.length === 0 && layers.every((l) => l.status !== 'error');

  const report: PersistenceVerificationReport = {
    timestamp: new Date().toISOString(),
    allOk,
    layers,
    warnings,
    errors,
  };

  slog.info('SYSTEM', 'verifyPersistence completed', { allOk, errorCount: errors.length, warningCount: warnings.length });

  return report;
}

/**
 * Textual summary of a verification report — useful for copy-paste in reports.
 */
export function formatVerificationReport(r: PersistenceVerificationReport): string {
  const lines: string[] = [
    `=== Rapport persistenza — ${r.timestamp} ===`,
    `Stato globale: ${r.allOk ? '✅ OK' : '⚠️  Anomalie rilevate'}`,
    '',
    '--- Layer ---',
    ...r.layers.map((l) => {
      const icon  = l.status === 'ok' ? '✅' : l.status === 'empty' ? '⚪' : l.status === 'missing' ? '⚠️ ' : '❌';
      const extra = l.entryCount !== undefined ? ` (${l.entryCount} voci, ${l.sizeBytes} B)` : '';
      return `${icon} ${l.layer}${extra}`;
    }),
  ];
  if (r.warnings.length > 0) {
    lines.push('', '--- Warning ---', ...r.warnings.map((w) => `⚠️  ${w}`));
  }
  if (r.errors.length > 0) {
    lines.push('', '--- Errori ---', ...r.errors.map((e) => `❌ ${e}`));
  }
  return lines.join('\n');
}
