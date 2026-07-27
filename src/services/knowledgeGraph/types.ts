/**
 * knowledgeGraph/types.ts — Core type definitions for the Knowledge Graph layer.
 *
 * The KG is a pure enhancement layer over the existing Zustand stores.
 * It does NOT replace store data — it mirrors and connects it.
 *
 * Node ID conventions:
 *   student nodes    → `student_${Studente.id}`
 *   class nodes      → `class_${normalizedClassName}`
 *   assessment nodes → `assessment_${Valutazione.id}`
 *   activity nodes   → `activity_${Lezione.id}`
 *   uda nodes        → `uda_${Uda.id}`
 *   competency nodes → `competency_${Competenza.id}`
 *   document nodes   → `doc_src_${normalizedKey}` | `doc_${timestamp}_${rand}`
 */

import type { ParsedDocument } from '../documentAI/types';

// ─── Node taxonomy ────────────────────────────────────────────────────────────

export type KGNodeType =
  | 'student'
  | 'class'
  | 'document'
  | 'assessment'
  | 'activity'
  | 'uda'
  | 'competency';

// ─── Edge taxonomy ─────────────────────────────────────────────────────────────

export type KGEdgeType =
  /** student → class                   (confidence: 1 — explicit from store) */
  | 'belongs_to_class'
  /** student → assessment              (confidence: 1 — explicit from store) */
  | 'has_assessment'
  /** assessment → activity (lezione)   (confidence: 1 — explicit FK) */
  | 'submitted_in'
  /** activity → uda                    (confidence: 1 — explicit FK) */
  | 'part_of_uda'
  /** uda → competency                  (confidence: 1 — explicit FK) */
  | 'develops_competency'
  /** document → student                (confidence: auto-link score) */
  | 'mentions_student'
  /** document → class                  (confidence: auto-link score) */
  | 'mentions_class'
  /** document → assessment             (confidence: auto-link score) */
  | 'contains_assessment'
  /** document → activity               (confidence: auto-link score) */
  | 'linked_to_activity'
  /** document → document               (superseded version chain) */
  | 'version_of';

// ─── Node ─────────────────────────────────────────────────────────────────────

export interface KGNode {
  /** Stable identifier — see ID conventions in file header. */
  id: string;
  type: KGNodeType;
  /** Human-readable label for UI and query display. */
  label: string;
  /**
   * Original entity ID in the corresponding Zustand store.
   * Absent for document nodes (they live only in the KG).
   */
  storeRef?: string;
  createdAt: string;   // ISO-8601
  updatedAt: string;   // ISO-8601
  metadata?: Record<string, unknown>;
}

// ─── Edge ─────────────────────────────────────────────────────────────────────

export interface KGEdge {
  /**
   * Stable edge ID: `${type}__${fromId}__${toId}`.
   * Upserting with the same ID is idempotent.
   */
  id: string;
  type: KGEdgeType;
  fromId: string;
  toId: string;
  /**
   * Auto-link confidence [0, 1].
   * 1.0 = explicit store FK; fractional = name-similarity auto-link.
   */
  confidence: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// ─── Document memory ──────────────────────────────────────────────────────────

/** Snapshot of a single previous processing run. */
export interface DocumentMemoryVersion {
  version: number;
  rawText: string;
  structuredData: ParsedDocument;
  confidence: number;
  savedAt: string;
}

/**
 * Persistent memory for a processed document.
 * Versioned: re-processing the same source increments `version` and
 * appends the old state to `history`.
 */
export interface DocumentMemory {
  /** ID of the corresponding KGNode with type='document'. */
  nodeId: string;
  rawText: string;
  structuredData: ParsedDocument;
  confidence: number;
  /** 1-based; increments on every re-processing of the same source. */
  version: number;
  /** Previous versions, oldest first. */
  history: DocumentMemoryVersion[];
  createdAt: string;
  updatedAt: string;
}

// ─── Graph container ──────────────────────────────────────────────────────────

export interface KGGraph {
  nodes: Record<string, KGNode>;
  edges: Record<string, KGEdge>;
  /** Keyed by DocumentMemory.nodeId (= document KGNode.id). */
  documentMemories: Record<string, DocumentMemory>;
  /** Schema version — used for future migrations. */
  schemaVersion: number;
  updatedAt: string;
}

// ─── Query surface ────────────────────────────────────────────────────────────

export interface KGQueryResult {
  nodes: KGNode[];
  edges: KGEdge[];
  documentMemories: DocumentMemory[];
}

export interface LinkingCandidate {
  node: KGNode;
  /** Jaro-Winkler similarity score [0, 1]. */
  score: number;
}
