/**
 * knowledgeGraph/linkingEngine.ts — Name-similarity linking and entity mirroring.
 *
 * Responsibilities:
 *   1. Jaro-Winkler similarity for Italian name matching
 *   2. Auto-link document nodes to known student/class entities
 *   3. Mirror store entities (Studente, Valutazione) into the graph
 *
 * The linking engine NEVER modifies Zustand stores.
 * It only writes to the KG via graphStore mutations.
 */

import type { KGNode, KGEdge, KGEdgeType, LinkingCandidate } from './types';
import type { ParsedDocument } from '../documentAI/types';
import { queryByType, upsertNode, upsertEdge } from './graphStore';

// ─── Jaro-Winkler similarity ──────────────────────────────────────────────────

/** Pure Jaro similarity — normalised to [0, 1]. */
function jaro(a: string, b: string): number {
  if (a === b) return 1;
  const matchWindow = Math.max(Math.floor(Math.max(a.length, b.length) / 2) - 1, 0);
  const aMatched = new Array<boolean>(a.length).fill(false);
  const bMatched = new Array<boolean>(b.length).fill(false);
  let matches = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatched[j] || a[i] !== b[j]) continue;
      aMatched[i] = true;
      bMatched[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatched[i]) continue;
    while (!bMatched[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  return (
    (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3
  );
}

/**
 * Jaro-Winkler similarity with prefix bonus (p = 0.1, max prefix = 4).
 * Case-insensitive; leading/trailing whitespace stripped.
 *
 * Returns a score in [0, 1]. Scores ≥ 0.82 are considered a match
 * for Italian full names.
 */
export function jaroWinkler(s1: string, s2: string): number {
  const s = s1.toLowerCase().trim();
  const t = s2.toLowerCase().trim();
  const j = jaro(s, t);
  const maxLen = Math.min(4, s.length, t.length);
  let l = 0;
  for (let i = 0; i < maxLen; i++) {
    if (s[i] === t[i]) l++;
    else break;
  }
  return j + l * 0.1 * (1 - j);
}

// ─── Candidate resolution ────────────────────────────────────────────────────

const SIMILARITY_THRESHOLD = 0.82;

/**
 * Find all student nodes whose label is similar enough to `name`.
 * Returns candidates above the threshold, sorted by score descending.
 */
export function findStudentCandidates(name: string): LinkingCandidate[] {
  return queryByType('student')
    .map((node) => ({ node, score: jaroWinkler(name, node.label) }))
    .filter((c) => c.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}

/**
 * Find all class nodes whose label is similar enough to `className`.
 */
export function findClassCandidates(className: string): LinkingCandidate[] {
  return queryByType('class')
    .map((node) => ({ node, score: jaroWinkler(className, node.label) }))
    .filter((c) => c.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function edgeId(type: KGEdgeType, from: string, to: string): string {
  return `${type}__${from}__${to}`;
}

function emit(
  type: KGEdgeType,
  fromId: string,
  toId: string,
  confidence: number,
  meta?: Record<string, unknown>,
): KGEdge {
  const edge: KGEdge = {
    id: edgeId(type, fromId, toId),
    type,
    fromId,
    toId,
    confidence,
    createdAt: new Date().toISOString(),
    metadata: meta,
  };
  upsertEdge(edge);
  return edge;
}

/** Ensure a class node exists. Safe to call multiple times (idempotent). */
export function ensureClassNode(className: string): KGNode {
  const id = `class_${className.toLowerCase().replace(/\s+/g, '_')}`;
  const existing = _graph_getClassById(id);
  if (existing) return existing;
  const node: KGNode = {
    id,
    type: 'class',
    label: className,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  upsertNode(node);
  return node;
}

/** Internal: look up a class node by exact ID without going through similarity. */
function _graph_getClassById(id: string): KGNode | undefined {
  return queryByType('class').find((n) => n.id === id);
}

// ─── Document → entity auto-linking ─────────────────────────────────────────

/**
 * Given a document node ID and its parsed content, create edges to all known
 * entities that can be resolved by name similarity.
 *
 * Returns the list of KGEdge objects that were created/updated.
 */
export function linkDocumentToEntities(
  docNodeId: string,
  parsed: ParsedDocument,
): KGEdge[] {
  const created: KGEdge[] = [];

  if (parsed.type === 'STUDENT_LIST') {
    for (const s of parsed.data.students) {
      // Link to matching student
      const studentMatch = findStudentCandidates(s.name)[0];
      if (studentMatch) {
        created.push(emit('mentions_student', docNodeId, studentMatch.node.id, studentMatch.score, {
          rawName: s.name,
        }));
      }
      // Link to mentioned class
      if (s.className) {
        ensureClassNode(s.className);
        const classMatch = findClassCandidates(s.className)[0];
        if (classMatch) {
          created.push(emit('mentions_class', docNodeId, classMatch.node.id, classMatch.score));
        }
      }
    }
  }

  if (parsed.type === 'GRADES_TABLE') {
    for (const ev of parsed.data.evaluations) {
      const studentMatch = findStudentCandidates(ev.studentName)[0];
      if (studentMatch) {
        // Link document → student, with implied grade in metadata
        created.push(emit('mentions_student', docNodeId, studentMatch.node.id, studentMatch.score, {
          rawName: ev.studentName,
          impliedGrade: ev.grade,
          impliedSubject: ev.subject ?? null,
          note: 'Grade not yet imported to store — use routeDocumentIntent to finalise',
        }));
      }
    }
  }

  // OFFICIAL_DOCUMENT and LESSON_PLAN have no structured names to resolve —
  // they will be linked explicitly when the user confirms an action in the app.

  return created;
}

// ─── Store entity mirroring ───────────────────────────────────────────────────

/**
 * Mirror a student from the Zustand store into the KG.
 * Also ensures the class node exists and creates a `belongs_to_class` edge.
 * Idempotent — safe to call on every subscription update.
 */
export function mirrorStudentNode(student: {
  id: string;
  nome: string;
  cognome: string;
  classe: string;
}): KGNode {
  const id = `student_${student.id}`;
  const label = `${student.nome} ${student.cognome}`.trim();
  const node: KGNode = {
    id,
    type: 'student',
    label,
    storeRef: student.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { classe: student.classe },
  };
  upsertNode(node);

  // Ensure class node + link
  const classNode = ensureClassNode(student.classe);
  emit('belongs_to_class', id, classNode.id, 1);

  return node;
}

/**
 * Mirror a grade (Valutazione) from the Zustand store into the KG.
 * Creates a `has_assessment` edge from the student node to the assessment node.
 * Idempotent.
 */
export function mirrorAssessmentNode(evaluation: {
  id: string;
  studenteId: string;
  materia: string;
  data: string;
  voto: string | number;
}): KGNode {
  const id = `assessment_${evaluation.id}`;
  const node: KGNode = {
    id,
    type: 'assessment',
    label: `${evaluation.materia} — ${evaluation.voto} (${evaluation.data})`,
    storeRef: evaluation.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      materia: evaluation.materia,
      voto: evaluation.voto,
      data: evaluation.data,
    },
  };
  upsertNode(node);

  // Student → assessment edge
  const studentNodeId = `student_${evaluation.studenteId}`;
  emit('has_assessment', studentNodeId, id, 1);

  return node;
}
