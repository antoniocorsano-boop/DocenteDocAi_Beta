/**
 * schoolSystems/kgBridge.ts — Links synced external data into the Knowledge Graph.
 *
 * After a successful sync, the bridge creates a synthetic document node in the KG
 * that represents the sync operation. This lets the AI Copilot reason about
 * externally-sourced data through the same graph traversal used for OCR documents.
 *
 * The bridge reuses `processDocumentIntoGraph()` from the existing KG pipeline —
 * no new KG write paths are introduced here.
 *
 * A synthetic DocumentIntent wraps the sync summary so that the KG pipeline sees
 * it as a STUDENT_LIST or GRADES_TABLE document, consistent with the OCR flow.
 */

import type { SyncResult } from './types';
import { processDocumentIntoGraph } from '../knowledgeGraph/pipeline';
import type { DocumentGraphResult }  from '../knowledgeGraph/pipeline';
import type { DocumentIntent }       from '../documentAI/types';
import { complianceLog } from './complianceLog';

/**
 * Link a completed sync result into the Knowledge Graph.
 *
 * @param syncResult   - Output from importStudentsFromRegistry / importGradesFromRegistry
 * @param humanSummary - Italian plain-text description of what was imported
 * @returns DocumentGraphResult for the created/updated KG node, or null if nothing to link
 */
export function linkSyncResultToKG(
    syncResult: SyncResult,
    humanSummary: string,
): DocumentGraphResult | null {
    if (syncResult.imported === 0) return null;

    const docType = syncResult.entity === 'students' ? 'STUDENT_LIST' as const : 'GRADES_TABLE' as const;

    // Build a synthetic DocumentIntent that represents the sync operation.
    // This flows through the same KG pipeline as OCR-derived documents,
    // so Copilot reasoning is uniform regardless of data source.
    // We use the UNKNOWN type with rawText to avoid constructing a full
    // ParsedStudentList/ParsedGradesTable — the KG pipeline only needs the
    // document type tag and rawText for node creation.
    const intent: DocumentIntent = {
        action:     docType === 'STUDENT_LIST' ? 'add_students_from_doc' : 'import_grades',
        confidence: 1.0,
        document:   {
            type:       'UNKNOWN',
            confidence: 1.0,
            data:       { rawText: humanSummary },
            warnings:   syncResult.errors.length > 0
                ? syncResult.errors.slice(0, 3)
                : undefined,
        },
    };

    // Stable deduplication key: one KG node per provider+class+entity
    const sourceKey = [
        'registry',
        syncResult.provider,
        syncResult.entity,
        syncResult.classCode ?? 'all',
        syncResult.period ?? 'all',
    ].join(':');

    try {
        const graphResult = processDocumentIntoGraph(intent, humanSummary, 1.0, sourceKey);
        complianceLog.record({
            action: 'kg_bridge_sync',
            context: {
                provider:  syncResult.provider,
                entity:    syncResult.entity,
                classCode: syncResult.classCode ?? 'all',
                nodeId:    graphResult.nodeId,
                isUpdate:  graphResult.isUpdate,
            },
        });
        return graphResult;
    } catch (err) {
        complianceLog.record({
            action: 'kg_bridge_error',
            context: {
                provider: syncResult.provider,
                error:    err instanceof Error ? err.message : 'unknown',
            },
        });
        return null;
    }
}

/**
 * Convenience: import students → link to KG in one step.
 */
export async function importAndLink(
    importFn: () => Promise<SyncResult>,
    humanSummary: (r: SyncResult) => string,
): Promise<{ syncResult: SyncResult; graphResult: DocumentGraphResult | null }> {
    const syncResult = await importFn();
    const graphResult = linkSyncResultToKG(syncResult, humanSummary(syncResult));
    return { syncResult, graphResult };
}
