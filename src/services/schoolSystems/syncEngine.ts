/**
 * schoolSystems/syncEngine.ts — Orchestrates import/export between school
 * systems and DocenteDoc's core stores.
 *
 * CLIENT-SIDE ONLY. All store writes go through routeSchoolSyncIntent() in
 * actionRouter — never direct store access from this module.
 *
 * Import flow:
 *   provider.fetchStudents() → normalizer → routeSchoolSyncIntent({ type: 'students' })
 *   provider.fetchGrades()   → normalizer → routeSchoolSyncIntent({ type: 'grades' })
 *
 * Export flow:
 *   grades (raw format) → provider.pushGrade() × N
 *
 * Every operation is written to the compliance audit log.
 */

import type { SyncResult, SyncEntity, RawGrade } from './types';
import { normalizeStudents, normalizeGrades } from './normalizer';
import { providerRegistry }  from './providerRegistry';
import { routeSchoolSyncIntent } from '../../integrations/chat/actionRouter';
import { complianceLog }     from './complianceLog';

// ─── Import helpers ───────────────────────────────────────────────────────────

function makeResult(
    provider: string,
    direction: 'import' | 'export',
    entity: SyncEntity,
    classCode?: string,
    period?: string,
): SyncResult {
    return { provider, direction, entity, classCode, period, total: 0, imported: 0, skipped: 0, errors: [], timestamp: new Date().toISOString() };
}

function notConnected(result: SyncResult): SyncResult {
    result.errors.push('Provider non connesso. Chiama connect() prima di sincronizzare.');
    return result;
}

// ─── Import students ──────────────────────────────────────────────────────────

/**
 * Pull students from an external registry and upsert them into the student store.
 * The operation is idempotent: re-syncing the same class will update existing
 * records (matched by the stable `ext_${providerId}_${externalId}` id).
 */
export async function importStudentsFromRegistry(
    providerId: string,
    classCode: string,
): Promise<SyncResult> {
    const result = makeResult(providerId, 'import', 'students', classCode);
    const provider = providerRegistry.get(providerId);
    if (!provider?.isConnected()) return notConnected(result);

    try {
        const raws = await provider.fetchStudents(classCode);
        result.total = raws.length;
        const students = normalizeStudents(raws, providerId);

        const outcome = await routeSchoolSyncIntent({
            type: 'students',
            students,
            classCode,
            provider: provider.name,
        });

        if (outcome.ok) {
            result.imported = students.length;
        } else {
            result.errors.push(outcome.message);
        }
    } catch (err) {
        result.errors.push(err instanceof Error ? err.message : 'Errore sconosciuto');
    }

    complianceLog.record({
        action: 'sync_import_students',
        context: { providerId, classCode, imported: result.imported, errors: result.errors.length },
    });
    return result;
}

// ─── Import grades ────────────────────────────────────────────────────────────

/**
 * Pull grades from an external registry and add them to the evaluation store.
 *
 * NOTE: Grade imports are NOT idempotent — re-syncing the same period will
 * create duplicates. Use the automation rule confirmation step (requiresConfirmation)
 * or filter by date range to prevent double imports.
 */
export async function importGradesFromRegistry(
    providerId: string,
    classCode: string,
    period?: string,
): Promise<SyncResult> {
    const result = makeResult(providerId, 'import', 'grades', classCode, period);
    const provider = providerRegistry.get(providerId);
    if (!provider?.isConnected()) return notConnected(result);

    try {
        const raws = await provider.fetchGrades(classCode, period);
        result.total = raws.length;
        const grades = normalizeGrades(raws, providerId);

        const outcome = await routeSchoolSyncIntent({
            type: 'grades',
            grades,
            classCode,
            period,
            provider: provider.name,
        });

        if (outcome.ok) {
            result.imported = grades.length;
        } else {
            result.skipped = grades.length;
            result.errors.push(outcome.message);
        }
    } catch (err) {
        result.errors.push(err instanceof Error ? err.message : 'Errore sconosciuto');
    }

    complianceLog.record({
        action: 'sync_import_grades',
        context: { providerId, classCode, period: period ?? 'all', imported: result.imported, errors: result.errors.length },
    });
    return result;
}

// ─── Export grades ────────────────────────────────────────────────────────────

/**
 * Push grades (already in raw format) to the external registry.
 * Convert DocenteDoc Valutazione to RawGrade before calling this function.
 */
export async function exportGradesToRegistry(
    providerId: string,
    grades: RawGrade[],
): Promise<SyncResult> {
    const result = makeResult(providerId, 'export', 'grades');
    result.total = grades.length;
    const provider = providerRegistry.get(providerId);
    if (!provider?.isConnected()) return notConnected(result);

    for (let i = 0; i < grades.length; i++) {
        try {
            const res = await provider.pushGrade(grades[i]);
            if (res.ok) {
                result.imported++;
            } else {
                result.skipped++;
                result.errors.push(`Voto ${i + 1}: risposta non-ok dal provider`);
            }
        } catch (err) {
            result.skipped++;
            result.errors.push(`Voto ${i + 1}: ${err instanceof Error ? err.message : 'Errore'}`);
        }
    }

    complianceLog.record({
        action: 'sync_export_grades',
        context: { providerId, exported: result.imported, errors: result.errors.length },
    });
    return result;
}
