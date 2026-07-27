/**
 * knowledgeGraph/graphStore.ts — Module-level singleton graph with localStorage persistence.
 *
 * This is NOT a Zustand store. It is a plain module-level service that:
 *   - keeps the graph in memory during the session
 *   - persists to localStorage on every mutation
 *   - is silently a no-op when localStorage is unavailable (Edge Functions, SSR)
 *
 * Graph is intentionally kept small: it mirrors entity IDs from Zustand stores
 * and adds document nodes + edges. The heavy domain data remains in Zustand.
 */

import type { KGGraph, KGNode, KGEdge, DocumentMemory, KGQueryResult } from './types';

const STORAGE_KEY = 'kg_graph_v1';
const SCHEMA_VERSION = 1;

// ─── Singleton ────────────────────────────────────────────────────────────────

let _graph: KGGraph = _loadOrInit();

function _loadOrInit(): KGGraph {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as KGGraph;
        if (parsed.schemaVersion === SCHEMA_VERSION) return parsed;
      }
    }
  } catch {
    // SSR or corrupted data — fall through to empty graph
  }
  return _empty();
}

function _empty(): KGGraph {
  return {
    nodes: {},
    edges: {},
    documentMemories: {},
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

function _persist(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      _graph.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_graph));
    }
  } catch {
    // Quota exceeded or private browsing — silently skip
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Insert or merge-update a node. Preserves createdAt on update. */
export function upsertNode(node: KGNode): void {
  const existing = _graph.nodes[node.id];
  _graph.nodes[node.id] = existing
    ? { ...existing, ...node, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
    : node;
  _persist();
}

/** Insert or overwrite an edge. Edge IDs are deterministic so this is idempotent. */
export function upsertEdge(edge: KGEdge): void {
  _graph.edges[edge.id] = edge;
  _persist();
}

/** Insert or overwrite a document memory. */
export function upsertDocumentMemory(memory: DocumentMemory): void {
  _graph.documentMemories[memory.nodeId] = memory;
  _persist();
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export function getNode(id: string): KGNode | undefined {
  return _graph.nodes[id];
}

export function getEdgesFrom(nodeId: string): KGEdge[] {
  return Object.values(_graph.edges).filter((e) => e.fromId === nodeId);
}

export function getEdgesTo(nodeId: string): KGEdge[] {
  return Object.values(_graph.edges).filter((e) => e.toId === nodeId);
}

export function getDocumentMemory(nodeId: string): DocumentMemory | undefined {
  return _graph.documentMemories[nodeId];
}

/** All nodes of a given type. */
export function queryByType(type: KGNode['type']): KGNode[] {
  return Object.values(_graph.nodes).filter((n) => n.type === type);
}

/**
 * Return all nodes, edges, and memories reachable from a document node.
 * Useful for rendering a document's knowledge context.
 */
export function queryDocument(nodeId: string): KGQueryResult {
  const rootNode = _graph.nodes[nodeId];
  if (!rootNode) return { nodes: [], edges: [], documentMemories: [] };

  const edges = [...getEdgesFrom(nodeId), ...getEdgesTo(nodeId)];
  const linkedIds = new Set(edges.flatMap((e) => [e.fromId, e.toId]));
  const nodes = [...linkedIds]
    .map((id) => _graph.nodes[id])
    .filter(Boolean) as KGNode[];
  const documentMemories = Object.values(_graph.documentMemories).filter(
    (m) => m.nodeId === nodeId,
  );

  return { nodes, edges, documentMemories };
}

/** Read-only snapshot of the full graph. */
export function getGraph(): Readonly<KGGraph> {
  return _graph;
}

/**
 * Hard reset — replaces graph with an empty state.
 * Only for use in tests.
 */
export function _resetGraph(): void {
  _graph = _empty();
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
