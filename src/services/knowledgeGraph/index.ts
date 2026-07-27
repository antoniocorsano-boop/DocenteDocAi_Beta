/**
 * knowledgeGraph/index.ts — Public API barrel.
 *
 * Import from here, not from sub-modules directly.
 *
 * Quick reference:
 *
 *   Graph mutations (store entities → KG):
 *     mirrorStudentNode(student)          → KGNode
 *     mirrorAssessmentNode(evaluation)    → KGNode
 *
 *   Document pipeline:
 *     processDocumentIntoGraph(intent, rawText, ocrConf, sourceKey?)
 *                                         → DocumentGraphResult
 *
 *   Queries:
 *     getNode(id)                         → KGNode | undefined
 *     queryByType('student')              → KGNode[]
 *     queryDocument(nodeId)               → KGQueryResult
 *     getDocumentMemory(nodeId)           → DocumentMemory | undefined
 *     findStudentCandidates(name)         → LinkingCandidate[]
 *     getGraph()                          → Readonly<KGGraph>
 *
 *   Similarity:
 *     jaroWinkler(s, t)                   → number [0, 1]
 */

// Types
export type {
  KGNode,
  KGEdge,
  KGNodeType,
  KGEdgeType,
  KGGraph,
  KGQueryResult,
  DocumentMemory,
  DocumentMemoryVersion,
  LinkingCandidate,
} from './types';

// Graph store (read + write)
export {
  upsertNode,
  upsertEdge,
  upsertDocumentMemory,
  getNode,
  getEdgesFrom,
  getEdgesTo,
  getDocumentMemory,
  queryByType,
  queryDocument,
  getGraph,
  _resetGraph,
} from './graphStore';

// Linking engine
export {
  jaroWinkler,
  findStudentCandidates,
  findClassCandidates,
  linkDocumentToEntities,
  ensureClassNode,
  mirrorStudentNode,
  mirrorAssessmentNode,
} from './linkingEngine';

// Document pipeline
export { processDocumentIntoGraph } from './pipeline';
export type { DocumentGraphResult } from './pipeline';
