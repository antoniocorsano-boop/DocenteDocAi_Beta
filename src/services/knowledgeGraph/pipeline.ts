/**
 * knowledgeGraph/pipeline.ts — Full document-to-graph pipeline.
 *
 * When called:
 *   1. Creates (or updates) the document KGNode
 *   2. Creates (or versions) the DocumentMemory
 *   3. Runs linkDocumentToEntities() to auto-create edges
 *   4. Returns a structured result for the caller
 *
 * This function is synchronous — all KG operations are in-memory + localStorage.
 */

import type { KGNode, KGEdge, DocumentMemory } from './types';
import type { DocumentIntent } from '../documentAI/types';
import { upsertNode, getDocumentMemory, upsertDocumentMemory } from './graphStore';
import { linkDocumentToEntities } from './linkingEngine';

// ─── Result type ─────────────────────────────────────────────────────────────

export interface DocumentGraphResult {
  /** ID of the document KGNode. */
  nodeId: string;
  node: KGNode;
  /** Edges created/updated during this processing run. */
  edges: KGEdge[];
  documentMemory: DocumentMemory;
  /** True when this is an update of a previously processed source. */
  isUpdate: boolean;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * Process a DocumentIntent into the Knowledge Graph.
 *
 * @param intent        - Full intent from detectDocumentIntent()
 * @param rawText       - Original OCR text (for DocumentMemory)
 * @param ocrConfidence - Confidence score from the OCR step [0, 1]
 * @param sourceKey     - Optional stable deduplication key (e.g. file name or SHA).
 *                        If provided, re-processing the same key increments version
 *                        and preserves history instead of creating a new node.
 */
export function processDocumentIntoGraph(
  intent: DocumentIntent,
  rawText: string,
  ocrConfidence: number,
  sourceKey?: string,
): DocumentGraphResult {
  const now = new Date().toISOString();

  // ── Step 1: Resolve node ID ──────────────────────────────────────────────
  const nodeId = sourceKey
    ? `doc_src_${sourceKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    : `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const existingMemory = getDocumentMemory(nodeId);
  const isUpdate = Boolean(existingMemory);

  // ── Step 2: Upsert KGNode ────────────────────────────────────────────────
  const node: KGNode = {
    id: nodeId,
    type: 'document',
    label: _documentLabel(intent),
    createdAt: existingMemory?.createdAt ?? now,
    updatedAt: now,
    metadata: {
      documentType: intent.document.type,
      intentAction: intent.action,
      intentConfidence: intent.confidence,
      sourceKey: sourceKey ?? null,
    },
  };
  upsertNode(node);

  // ── Step 3: Create / version DocumentMemory ──────────────────────────────
  const prevHistory = existingMemory
    ? [
        ...existingMemory.history,
        {
          version: existingMemory.version,
          rawText: existingMemory.rawText,
          structuredData: existingMemory.structuredData,
          confidence: existingMemory.confidence,
          savedAt: existingMemory.updatedAt,
        },
      ]
    : [];

  const documentMemory: DocumentMemory = {
    nodeId,
    rawText,
    structuredData: intent.document,
    confidence: ocrConfidence,
    version: (existingMemory?.version ?? 0) + 1,
    history: prevHistory,
    createdAt: existingMemory?.createdAt ?? now,
    updatedAt: now,
  };
  upsertDocumentMemory(documentMemory);

  // ── Step 4: Auto-link to entities ────────────────────────────────────────
  const edges = linkDocumentToEntities(nodeId, intent.document);

  return { nodeId, node, edges, documentMemory, isUpdate };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _documentLabel(intent: DocumentIntent): string {
  const date = new Date().toLocaleDateString('it-IT');
  switch (intent.document.type) {
    case 'STUDENT_LIST':       return `Lista studenti — ${date}`;
    case 'GRADES_TABLE':       return `Registro voti — ${date}`;
    case 'OFFICIAL_DOCUMENT':  return `Documento ufficiale — ${date}`;
    case 'LESSON_PLAN':        return `Piano lezione — ${date}`;
    default:                   return `Documento — ${date}`;
  }
}
