/**
 * schoolSystems/chatCommands.ts — Chat integration for school system operations.
 *
 * Registers automation rules and exports intent handler strings that allow users
 * to trigger sync, confirm operations, and automate workflows via chat.
 *
 * Integration model (adapter — no core code modified):
 *   1. Automation rules fire on `school_sync_requested` trigger type
 *   2. The chat UI (Copilot panel) can call triggerSchoolSyncFromChat() directly
 *   3. Response builders from responseBuilder.ts wrap the results
 *
 * Chat commands recognised (parsed upstream by the intent layer):
 *   "sincronizza studenti 3A da spaggiari"  → sync_students
 *   "importa voti 2B primo quadrimestre"     → sync_grades
 *   "collega registro spaggiari"             → connect_provider
 *   "genera pagella 3A"                      → generate_document
 *   "esporta audit log"                      → export_audit
 */

import type { AutomationRule, AutomationTriggerPayload } from '../automation/types';
import { automationEngine }             from '../automation/automationEngine';
import { providerRegistry }             from './providerRegistry';
import { importStudentsFromRegistry,
         importGradesFromRegistry }     from './syncEngine';
import { linkSyncResultToKG }           from './kgBridge';
import { complianceLog }                from './complianceLog';

// ─── Automation rules ─────────────────────────────────────────────────────────

/**
 * RULE: Auto-sync students after connecting a provider.
 * Fires when the automation engine receives a `school_sync_requested` trigger
 * with entity = 'students'. Requires teacher confirmation.
 */
const autoSyncStudents: AutomationRule = {
    id:          'school_sync_students',
    name:        'Sincronizzazione automatica studenti',
    description: 'Quando si collega un registro scolastico, propone di ' +
                 'importare automaticamente la lista studenti.',
    triggerType: 'school_sync_requested',
    condition:   (payload: AutomationTriggerPayload): boolean => {
        if (payload.type !== 'school_sync_requested') return false;
        return payload.data.entity === 'students';
    },
    action: {
        type:     'send_chat_message',
        template: '📋 Trovati nuovi studenti nel registro {{providerId}} per la classe {{classCode}}. ' +
                  'Vuoi importarli in DocenteDoc?',
    },
    enabled:             true,
    requiresConfirmation: true,
};

/**
 * RULE: Confirm before importing grades from an external registry.
 * Grade imports are high-risk (potential duplicates) — always needs approval.
 */
const confirmGradeSyncImport: AutomationRule = {
    id:          'school_sync_grades_confirm',
    name:        'Conferma importazione voti da registro',
    description: 'Richiede sempre conferma prima di importare voti da un ' +
                 'sistema scolastico esterno.',
    triggerType: 'school_sync_requested',
    condition:   (payload: AutomationTriggerPayload): boolean => {
        if (payload.type !== 'school_sync_requested') return false;
        return payload.data.entity === 'grades';
    },
    action: {
        type:     'send_chat_message',
        template: '📊 Trovati nuovi voti nel registro {{providerId}} per la classe {{classCode}}. ' +
                  'Vuoi importarli? I voti existenti NON verranno sovrascritti.',
    },
    enabled:             true,
    requiresConfirmation: true,
};

/**
 * RULE: Log all school system operations to the audit trail automatically.
 */
const auditSchoolOps: AutomationRule = {
    id:          'audit_school_operations',
    name:        'Audit operazioni registro scolastico',
    description: 'Registra automaticamente tutte le operazioni ' +
                 'di sincronizzazione nel log di conformità.',
    triggerType: 'school_sync_requested',
    condition:   () => true,
    action:      { type: 'log_only' },
    enabled:     true,
    requiresConfirmation: false,
};

// ─── Registration ─────────────────────────────────────────────────────────────

let _registered = false;

/**
 * Register all school system automation rules.
 * Idempotent — safe to call multiple times.
 */
export function registerSchoolSystemRules(): void {
    if (_registered) return;
    automationEngine.register(autoSyncStudents);
    automationEngine.register(confirmGradeSyncImport);
    automationEngine.register(auditSchoolOps);
    _registered = true;
}

// ─── Chat-triggered sync ──────────────────────────────────────────────────────

export interface SyncFromChatParams {
    providerId: string;
    entity: 'students' | 'grades';
    classCode: string;
    period?: string;
    linkToKG?: boolean;
}

export interface SyncFromChatResult {
    ok: boolean;
    message: string;
    details?: {
        imported: number;
        skipped: number;
        errors: string[];
        kgLinked: boolean;
    };
}

/**
 * Execute a sync operation initiated from the chat UI (Copilot panel or webhook).
 *
 * This is the single entry point for chat-driven syncs.
 * The result can be passed to buildActionResponse() for formatting.
 */
export async function triggerSchoolSyncFromChat(
    params: SyncFromChatParams,
): Promise<SyncFromChatResult> {
    const { providerId, entity, classCode, period, linkToKG = true } = params;

    const provider = providerRegistry.get(providerId);
    if (!provider) {
        return { ok: false, message: `Provider "${providerId}" non trovato. Registralo prima con providerRegistry.register().` };
    }
    if (!provider.isConnected()) {
        return { ok: false, message: `Provider "${provider.name}" non connesso. Effettua il collegamento prima di sincronizzare.` };
    }

    complianceLog.record({
        action:   `chat_sync_${entity}`,
        operator: 'chat',
        context:  { providerId, classCode, period: period ?? 'all' },
    });

    try {
        const syncResult = entity === 'students'
            ? await importStudentsFromRegistry(providerId, classCode)
            : await importGradesFromRegistry(providerId, classCode, period);

        let kgLinked = false;
        if (linkToKG && syncResult.imported > 0) {
            const summary = entity === 'students'
                ? `Importati ${syncResult.imported} studenti dalla classe ${classCode} da ${provider.name}.`
                : `Importati ${syncResult.imported} voti della classe ${classCode} da ${provider.name}.`;
            const graphResult = linkSyncResultToKG(syncResult, summary);
            kgLinked = graphResult !== null;
        }

        const what  = entity === 'students' ? 'student' : 'valutazion';
        const plural = syncResult.imported !== 1;
        const msg   = syncResult.imported > 0
            ? `✅ Sincronizzat${plural ? 'i' : 'o'} ${syncResult.imported} ${what}${plural ? 'i' : 'e'} da ${provider.name}.`
            : `⚠️ Nessun dato importato da ${provider.name}. Controlla la classe e il periodo selezionati.`;

        return {
            ok:      syncResult.imported > 0 || syncResult.errors.length === 0,
            message: msg,
            details: {
                imported: syncResult.imported,
                skipped:  syncResult.skipped,
                errors:   syncResult.errors,
                kgLinked,
            },
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
        complianceLog.record({
            action:  `chat_sync_${entity}_error`,
            context: { providerId, classCode, error: msg },
        });
        return { ok: false, message: `❌ Errore durante la sincronizzazione: ${msg}` };
    }
}

// ─── Chat command recognition helpers ────────────────────────────────────────

/** Italian command patterns → sync parameters (for upstream intent parser). */
export const SYNC_COMMAND_PATTERNS = {
    syncStudents: /sincronizza\s+(?:studenti|alunni)\s+(\w+)\s+da\s+(\w+)/i,
    syncGrades:   /importa\s+voti\s+(\w+)(?:\s+(.+?))?(?:\s+da\s+(\w+))?/i,
    connectProvider: /collega\s+registro\s+(\w+)/i,
    generateDoc:  /genera\s+(pagella|verbale|relazione|certificazione|piano.recupero|comunicazione)\s+(\w+)/i,
    exportAudit:  /esporta\s+(?:audit|log)\b/i,
} as const;

/**
 * Parse a natural language sync command into SyncFromChatParams.
 * Returns null if the command does not match any known pattern.
 */
export function parseSyncCommand(text: string): SyncFromChatParams | null {
    const studentsMatch = SYNC_COMMAND_PATTERNS.syncStudents.exec(text);
    if (studentsMatch) {
        return { entity: 'students', classCode: studentsMatch[1], providerId: studentsMatch[2].toLowerCase() };
    }

    const gradesMatch = SYNC_COMMAND_PATTERNS.syncGrades.exec(text);
    if (gradesMatch) {
        return {
            entity:     'grades',
            classCode:  gradesMatch[1],
            period:     gradesMatch[2],
            providerId: (gradesMatch[3] ?? providerRegistry.getConnected()[0]?.id ?? 'unknown').toLowerCase(),
        };
    }

    return null;
}
