/**
 * tenant/schoolInsights.ts — Cross-class and school-level analytics.
 *
 * PRINCIPAL / ADMIN only — permission checks enforced at call sites.
 *
 * All queries are pure in-memory operations on the KG
 * (getTenantGraph) and on the KGEdge/KGNode layer.
 * They DO NOT access Zustand stores directly.
 *
 * Functions return plain data structures — no UI assumptions.
 */

import type { TenantContext } from './types';
import { assertCan } from './permissionGuard';
import { getTenantGraph } from '../knowledgeGraph/tenantGraph';
import type { KGNode } from '../knowledgeGraph/types';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ClassRiskSignal {
  /** KGNode.id of the class node. */
  classNodeId: string;
  className: string;
  /**
   * Risk level based on heuristics:
   *   HIGH:    avg linked-document confidence < 0.4
   *            OR > 30% of students have no assessment edges
   *   MEDIUM:  avg confidence 0.4–0.65
   *            OR > 15% students missing assessments
   *   LOW:     all metrics healthy
   */
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Human-readable explanation for each risk signal detected. */
  signals: string[];
}

export interface SchoolSnapshot {
  tenantId: string;
  generatedAt: string;
  totalStudents: number;
  totalClasses: number;
  totalDocuments: number;
  totalAssessments: number;
  classRisks: ClassRiskSignal[];
  /** % of documents processed with confidence < 0.5 */
  lowConfidenceDocumentRate: number;
  /** % of students with at least one assessment edge */
  assessedStudentRate: number;
}

export interface DashboardQuery {
  /** Summary card data for the PRINCIPAL dashboard. */
  snapshot: SchoolSnapshot;
  /** Classes ordered by risk (HIGH first). */
  riskRanking: ClassRiskSignal[];
  /** Nodes without any edges — potential orphaned data. */
  orphanedNodes: KGNode[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function confidenceFromNode(node: KGNode): number {
  const raw = node.metadata?.['intentConfidence'];
  return typeof raw === 'number' ? raw : 1;
}

// ─── Insight functions ────────────────────────────────────────────────────────

/**
 * Build a risk signal for a single class node.
 */
function buildClassRisk(
  classNode: KGNode,
  graph: ReturnType<typeof getTenantGraph>,
): ClassRiskSignal {
  const signals: string[] = [];

  // Students in this class
  const studentEdges = graph.getEdgesTo(classNode.id)
    .filter((e) => e.type === 'belongs_to_class');
  const studentCount = studentEdges.length;

  if (studentCount === 0) {
    signals.push('Nessuno studente registrato per questa classe.');
  }

  // Assessments: students without any assessment edge
  const studentsWithAssessments = new Set(
    graph.getEdgesFrom(classNode.id)
      .filter((e) => e.type === 'has_assessment')
      .map((e) => e.fromId),
  );

  // Each student node linked to this class
  const studentNodeIds = studentEdges.map((e) => e.fromId);
  const studentsWithoutAssessment = studentNodeIds.filter(
    (id) => !studentsWithAssessments.has(id),
  );
  const missingRate = studentCount > 0 ? studentsWithoutAssessment.length / studentCount : 0;

  if (missingRate > 0.3) {
    signals.push(
      `${Math.round(missingRate * 100)}% degli studenti non ha valutazioni nel Knowledge Graph.`,
    );
  } else if (missingRate > 0.15) {
    signals.push(
      `${Math.round(missingRate * 100)}% degli studenti ha poche valutazioni tracciate.`,
    );
  }

  // Document confidence for docs mentioning this class
  const docEdges = graph.getEdgesTo(classNode.id)
    .filter((e) => e.type === 'mentions_class');
  const avgDocConf = docEdges.length > 0
    ? docEdges.reduce((acc, e) => acc + e.confidence, 0) / docEdges.length
    : 1;

  if (avgDocConf < 0.4 && docEdges.length > 0) {
    signals.push(`Qualità media documenti bassa (${Math.round(avgDocConf * 100)}%).`);
  }

  const riskLevel: ClassRiskSignal['riskLevel'] =
    missingRate > 0.3 || avgDocConf < 0.4 ? 'HIGH' :
    missingRate > 0.15 || avgDocConf < 0.65 ? 'MEDIUM' :
    'LOW';

  return {
    classNodeId: classNode.id,
    className: classNode.label,
    riskLevel,
    signals: signals.length > 0 ? signals : ['Nessun segnale di rischio rilevato.'],
  };
}

/**
 * Generate a full school snapshot for the PRINCIPAL dashboard.
 *
 * @param ctx       - Active TenantContext (must be PRINCIPAL or ADMIN)
 * @param tenantId  - Target tenant to analyse (must equal ctx.tenantId)
 */
export function generateSchoolSnapshot(
  ctx: TenantContext,
  tenantId: string,
): SchoolSnapshot {
  assertCan(ctx, 'school_analytics', 'read');
  // Enforce same-tenant — no cross-tenant analytics
  if (tenantId !== ctx.tenantId) {
    throw new Error(`Cross-tenant analytics denied: ${tenantId} ≠ ${ctx.tenantId}`);
  }

  const graph = getTenantGraph(tenantId);
  const graphData = graph.getGraph();

  const studentNodes   = graph.queryByType('student');
  const classNodes     = graph.queryByType('class');
  const documentNodes  = graph.queryByType('document');
  const assessmentNodes = graph.queryByType('assessment');

  const classRisks = classNodes.map((cn) => buildClassRisk(cn, graph));

  // Low confidence document rate
  const lowConfDocs = documentNodes.filter((d) => confidenceFromNode(d) < 0.5).length;
  const lowConfidenceDocumentRate = documentNodes.length > 0
    ? lowConfDocs / documentNodes.length : 0;

  // Assessed student rate
  const allEdges = Object.values(graphData.edges);
  const assessedIds = new Set(
    allEdges.filter((e) => e.type === 'has_assessment').map((e) => e.fromId),
  );
  const assessedStudentRate = studentNodes.length > 0
    ? assessedIds.size / studentNodes.length : 0;

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    totalStudents:    studentNodes.length,
    totalClasses:     classNodes.length,
    totalDocuments:   documentNodes.length,
    totalAssessments: assessmentNodes.length,
    classRisks,
    lowConfidenceDocumentRate,
    assessedStudentRate,
  };
}

/**
 * Full dashboard query: snapshot + risk ranking + orphaned nodes.
 */
export function queryPrincipalDashboard(
  ctx: TenantContext,
  tenantId: string,
): DashboardQuery {
  const snapshot = generateSchoolSnapshot(ctx, tenantId);
  const graph = getTenantGraph(tenantId);
  const graphData = graph.getGraph();

  const riskRanking = [...snapshot.classRisks].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return order[a.riskLevel] - order[b.riskLevel];
  });

  // Orphaned nodes: no edges in or out
  const connectedIds = new Set(
    Object.values(graphData.edges).flatMap((e) => [e.fromId, e.toId]),
  );
  const orphanedNodes = Object.values(graphData.nodes).filter(
    (n) => !connectedIds.has(n.id),
  );

  return { snapshot, riskRanking, orphanedNodes };
}

/**
 * Detect school-wide document processing patterns.
 * Returns natural-language Italian insights for the PRINCIPAL chat.
 */
export function detectSchoolPatterns(ctx: TenantContext, tenantId: string): string[] {
  const snapshot = generateSchoolSnapshot(ctx, tenantId);
  const insights: string[] = [];

  if (snapshot.totalDocuments === 0) {
    insights.push('Nessun documento elaborato ancora. Avvia il processo con i docenti della scuola.');
    return insights;
  }

  if (snapshot.lowConfidenceDocumentRate > 0.4) {
    insights.push(
      `Il ${Math.round(snapshot.lowConfidenceDocumentRate * 100)}% dei documenti ha bassa qualità OCR. ` +
      'Potrebbe essere necessaria una sessione di formazione sulla scansione documenti.',
    );
  }

  if (snapshot.assessedStudentRate < 0.5) {
    insights.push(
      `Solo il ${Math.round(snapshot.assessedStudentRate * 100)}% degli studenti ha valutazioni nel sistema. ` +
      'I docenti potrebbero non aver ancora importato le schede valutative.',
    );
  }

  const highRiskClasses = snapshot.classRisks.filter((c) => c.riskLevel === 'HIGH');
  if (highRiskClasses.length > 0) {
    insights.push(
      `${highRiskClasses.length} classe/i con segnali di rischio alto: ` +
      highRiskClasses.map((c) => c.className).join(', ') + '.',
    );
  }

  if (insights.length === 0) {
    insights.push('La scuola è in linea con gli obiettivi di utilizzo del sistema.');
  }

  return insights;
}
