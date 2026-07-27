/**
 * useGdprDataManager.ts — C14: GDPR data management hook.
 *
 * Espone:
 *   - exportUserData()     — raccoglie tutti i dati localStorage e li restituisce
 *                            come JSON blob scaricabile (portabilità GDPR Art. 20).
 *   - deletePersonalData() — cancella i dati non obbligatori per legge
 *                            (diritto alla cancellazione GDPR Art. 17).
 *   - getStorageSummary()  — descrive cosa è conservato e per quanto tempo.
 *
 * I dati di audit obbligatori (AI Act Art. 12, CAD Art. 32) NON vengono
 * eliminati anche con deletePersonalData() — viene emesso un avviso.
 *
 * MD3-compliant: nessun side-effect visivo — solo logica e stato puro.
 */

import { useState, useCallback } from 'react';
import { slog }                  from '../utils/structuredLogger';

// ─── Storage key categories ───────────────────────────────────────────────────

/** Chiavi obbligatorie per legge — NON eliminabili (AI Act Art. 12, GDPR Art. 5). */
const MANDATORY_KEYS = new Set([
  'enterprise_audit_log_v1',      // Audit trail AI
  'compliance_db_v1',             // Compliance database (Zustand persist key)
  'docente-doc-audit-trail',      // Audit trail store PA
  'sovereignty_config_v1',        // Configurazione utente
]);

/** Chiavi contenenti dati personali del docente eliminabili su richiesta. */
const PERSONAL_DATA_KEYS = [
  'docente-doc-system-store',     // Profilo utente, preferenze
  'approvations-queue-v1',        // Coda approvazioni
  'userBehaviorProfile_v1',       // Profilo comportamentale
  'privacy_consent_v1',           // log del consenso
  'structured_logs_v1',           // Log eventi (non obbligatori)
  'feature_flags_v1',             // Preferenze feature
];

/** Chiavi contenenti dati didattici (eliminabili separatamente). */
const DIDACTIC_DATA_KEYS_PREFIX = [
  'uda-store',
  'student-store',
  'evaluation-store',
  'classroom-store',
  'docente-',
  'planning-',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StorageEntry {
  key:          string;
  sizeBytes:    number;
  category:     'personal' | 'didactic' | 'mandatory' | 'other';
  description:  string;
  canDelete:    boolean;
}

export interface StorageSummary {
  totalSizeBytes:   number;
  entryCount:       number;
  entries:          StorageEntry[];
  mandatoryCount:   number;
  deletableCount:   number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyKey(key: string): StorageEntry['category'] {
  if (MANDATORY_KEYS.has(key))                  return 'mandatory';
  if (PERSONAL_DATA_KEYS.includes(key))         return 'personal';
  if (DIDACTIC_DATA_KEYS_PREFIX.some((p) => key.startsWith(p))) return 'didactic';
  return 'other';
}

function describeKey(key: string, category: StorageEntry['category']): string {
  const labels: Record<string, string> = {
    enterprise_audit_log_v1:      'Log audit AI (obbligatorio AI Act Art. 12)',
    compliance_db_v1:             'Database compliance (obbligatorio GDPR Art. 5)',
    'docente-doc-audit-trail':    'Log audit trail run PA (obbligatorio AI Act Art. 12)',
    sovereignty_config_v1:        'Configurazione sovranità utente',
    privacy_consent_v1:           'Registro consenso GDPR',
    userBehaviorProfile_v1:       'Profilo comportamentale docente',
    structured_logs_v1:           'Log strutturati di sistema',
    feature_flags_v1:             'Preferenze funzionalità',
    'approvations-queue-v1':      'Coda approvazioni HITL',
  };
  if (key in labels) return labels[key];
  if (category === 'didactic') return `Dati didattici — ${key}`;
  if (category === 'mandatory') return `Dati obbligatori — ${key}`;
  return key;
}

function getAllStorageEntries(): StorageEntry[] {
  const entries: StorageEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const raw      = localStorage.getItem(key) ?? '';
      const size     = new Blob([raw]).size;
      const category = classifyKey(key);
      entries.push({
        key,
        sizeBytes:   size,
        category,
        description: describeKey(key, category),
        canDelete:   category !== 'mandatory',
      });
    }
  } catch {
    // localStorage not available
  }
  return entries;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type DeletionScope = 'personal' | 'all_deletable';

export interface GdprDataManagerReturn {
  /** Descrizione dei dati conservati */
  summary:           StorageSummary | null;
  /** Operazione in corso */
  pending:           boolean;
  /** Ultimo messaggio di stato */
  statusMessage:     string;
  /** Carica la summary (lazy) */
  loadSummary:       () => void;
  /** Esporta tutti i dati come file JSON scaricabile */
  exportUserData:    () => void;
  /** Cancella dati personali (scope: 'personal' o 'all_deletable') */
  deletePersonalData: (scope?: DeletionScope) => Promise<{ deleted: number; skipped: number }>;
}

export function useGdprDataManager(): GdprDataManagerReturn {
  const [summary,       setSummary]       = useState<StorageSummary | null>(null);
  const [pending,       setPending]       = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadSummary = useCallback(() => {
    const entries  = getAllStorageEntries();
    const total    = entries.reduce((acc, e) => acc + e.sizeBytes, 0);
    setSummary({
      totalSizeBytes:  total,
      entryCount:      entries.length,
      entries,
      mandatoryCount:  entries.filter((e) => e.category === 'mandatory').length,
      deletableCount:  entries.filter((e) => e.canDelete).length,
    });
  }, []);

  const exportUserData = useCallback(() => {
    setPending(true);
    try {
      const allData: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        exportVersion: '2026.1',
        entries: {},
      };

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const raw = localStorage.getItem(key);
        try {
          (allData.entries as Record<string, unknown>)[key] = raw ? JSON.parse(raw) : raw;
        } catch {
          (allData.entries as Record<string, unknown>)[key] = raw;
        }
      }

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `docentedoc-gdpr-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      slog.info('SYSTEM', 'Export GDPR completato');
      setStatusMessage('Dati esportati correttamente.');
    } catch (err) {
      slog.error('SYSTEM', 'Export GDPR fallito', { err: String(err) });
      setStatusMessage('Errore durante l\'export dei dati.');
    } finally {
      setPending(false);
    }
  }, []);

  const deletePersonalData = useCallback(
    async (scope: DeletionScope = 'personal'): Promise<{ deleted: number; skipped: number }> => {
      setPending(true);
      let deleted = 0;
      let skipped = 0;

      try {
        const entries = getAllStorageEntries();
        const targets = entries.filter((e) => {
          if (!e.canDelete) return false;
          if (scope === 'personal') return e.category === 'personal';
          return true; // all_deletable
        });

        for (const entry of targets) {
          try {
            localStorage.removeItem(entry.key);
            deleted++;
          } catch {
            skipped++;
          }
        }

        slog.info('SYSTEM', 'Cancellazione GDPR completata', { deleted, skipped, scope });
        setStatusMessage(
          `${deleted} voci eliminate. ${skipped > 0 ? `${skipped} non eliminabili.` : ''}`,
        );
        // Reload summary after deletion
        loadSummary();
      } catch (err) {
        slog.error('SYSTEM', 'Cancellazione GDPR fallita', { err: String(err) });
        setStatusMessage('Errore durante la cancellazione dei dati.');
      } finally {
        setPending(false);
      }

      return { deleted, skipped };
    },
    [loadSummary],
  );

  return {
    summary,
    pending,
    statusMessage,
    loadSummary,
    exportUserData,
    deletePersonalData,
  };
}
