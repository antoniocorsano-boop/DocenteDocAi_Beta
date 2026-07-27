/**
 * knowledgeGraph/tenantGraph.ts — Per-tenant KG graph store factory.
 *
 * Provides isolated KnowledgeGraph instances per tenantId.
 * Each instance uses its own localStorage key: `kg_graph_v1_${tenantId}`.
 *
 * The default singleton in graphStore.ts uses key `kg_graph_v1` (no suffix).
 * This factory creates additional instances for multi-tenant deployments
 * WITHOUT modifying the existing singleton.
 *
 * Usage:
 *   const graph = getTenantGraph('iis_garibaldi');
 *   graph.upsertNode(node);
 *   graph.queryByType('student');
 */

import type { KGNode, KGEdge, DocumentMemory, KGGraph, KGQueryResult } from './types';

const SCHEMA_VERSION = 1;
const MAX_CACHE_SIZE = 20;   // max number of tenant instances kept in memory

// ─── Graph store interface (mirrors graphStore.ts exports) ───────────────────

export interface TenantGraphStore {
  upsertNode(node: KGNode): void;
  upsertEdge(edge: KGEdge): void;
  upsertDocumentMemory(memory: DocumentMemory): void;
  getNode(id: string): KGNode | undefined;
  getEdgesFrom(nodeId: string): KGEdge[];
  getEdgesTo(nodeId: string): KGEdge[];
  getDocumentMemory(nodeId: string): DocumentMemory | undefined;
  queryByType(type: KGNode['type']): KGNode[];
  queryDocument(nodeId: string): KGQueryResult;
  getGraph(): Readonly<KGGraph>;
  reset(): void;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function empty(): KGGraph {
  return {
    nodes: {},
    edges: {},
    documentMemories: {},
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

function loadOrInit(storageKey: string): KGGraph {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as KGGraph;
        if (parsed.schemaVersion === SCHEMA_VERSION) return parsed;
      }
    }
  } catch { /* SSR or corrupted */ }
  return empty();
}

function persist(storageKey: string, graph: KGGraph): void {
  try {
    if (typeof localStorage !== 'undefined') {
      graph.updatedAt = new Date().toISOString();
      localStorage.setItem(storageKey, JSON.stringify(graph));
    }
  } catch { /* quota / private */ }
}

function createStore(storageKey: string): TenantGraphStore {
  let g: KGGraph = loadOrInit(storageKey);

  return {
    upsertNode(node: KGNode): void {
      const existing = g.nodes[node.id];
      g.nodes[node.id] = existing
        ? { ...existing, ...node, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
        : node;
      persist(storageKey, g);
    },

    upsertEdge(edge: KGEdge): void {
      g.edges[edge.id] = edge;
      persist(storageKey, g);
    },

    upsertDocumentMemory(memory: DocumentMemory): void {
      g.documentMemories[memory.nodeId] = memory;
      persist(storageKey, g);
    },

    getNode(id: string): KGNode | undefined { return g.nodes[id]; },

    getEdgesFrom(nodeId: string): KGEdge[] {
      return Object.values(g.edges).filter((e) => e.fromId === nodeId);
    },

    getEdgesTo(nodeId: string): KGEdge[] {
      return Object.values(g.edges).filter((e) => e.toId === nodeId);
    },

    getDocumentMemory(nodeId: string): DocumentMemory | undefined {
      return g.documentMemories[nodeId];
    },

    queryByType(type: KGNode['type']): KGNode[] {
      return Object.values(g.nodes).filter((n) => n.type === type);
    },

    queryDocument(nodeId: string): KGQueryResult {
      const root = g.nodes[nodeId];
      if (!root) return { nodes: [], edges: [], documentMemories: [] };
      const fromEdges = Object.values(g.edges).filter((e) => e.fromId === nodeId);
      const toEdges   = Object.values(g.edges).filter((e) => e.toId === nodeId);
      const edges = [...fromEdges, ...toEdges];
      const ids = new Set(edges.flatMap((e) => [e.fromId, e.toId]));
      const nodes = ([...ids].map((id) => g.nodes[id]).filter(Boolean) as KGNode[]);
      return { nodes, edges, documentMemories: Object.values(g.documentMemories).filter((m) => m.nodeId === nodeId) };
    },

    getGraph(): Readonly<KGGraph> { return g; },

    reset(): void {
      g = empty();
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(storageKey);
      } catch { /* ignore */ }
    },
  };
}

// ─── LRU-bounded instance cache ───────────────────────────────────────────────

const instanceCache = new Map<string, TenantGraphStore>();

/**
 * Get (or lazily create) a KG store instance for the given tenantId.
 * Instances are cached for the session lifetime.
 * The 'personal' (default) tenantId maps to the same storage key as the
 * module-level singleton in graphStore.ts — no data duplication.
 */
export function getTenantGraph(tenantId: string): TenantGraphStore {
  const cached = instanceCache.get(tenantId);
  if (cached) return cached;

  // Evict oldest entry if cache is full
  if (instanceCache.size >= MAX_CACHE_SIZE) {
    const oldest = instanceCache.keys().next().value;
    if (oldest) instanceCache.delete(oldest);
  }

  const storageKey =
    tenantId === 'personal' ? 'kg_graph_v1' : `kg_graph_v1_${tenantId}`;
  const store = createStore(storageKey);
  instanceCache.set(tenantId, store);
  return store;
}
