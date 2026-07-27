/**
 * complianceReportGenerator.ts — C10: Generatore report compliance strutturato.
 *
 * Aggrega i risultati di:
 *   - evaluateAllRules (13 regole GDPR + AI Act + AgID)
 *   - generateDPIA (GDPR Art. 35)
 *   - generateCertificationPackage (readiness score, gap analysis)
 *   - auditSimulator (5 scenari predefiniti)
 *
 * Produce un ComplianceReport con sezioni GDPR / AI Act / AgID
 * esportabile come JSON o testo strutturato (per gare PA / audit CE).
 */

import { buildContext }                from '../self-compliance/runtime/context/contextBuilder';
import { evaluateAllRules }            from '../self-compliance/runtime/evaluator/rulesEvaluator';
import { useComplianceStore }          from '../self-compliance/useComplianceStore';
import { generateDPIA }                from '../self-compliance/certification/dpiaGenerator';
import { generateCertificationPackage } from '../self-compliance/certification/certificationPackage';
import { AUDIT_SCENARIOS, runAuditSimulation } from '../self-compliance/runtime/audit/auditSimulator';
import type { ComplianceViolation, RuleFramework } from '../self-compliance/runtime/types';
import type { CertificationPackage } from '../self-compliance/certification/types';
import { slog } from '../utils/structuredLogger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FrameworkSection {
  framework:    RuleFramework;
  label:        string;
  score:        number;    // 0–100
  passed:       number;
  total:        number;
  violations:   ComplianceViolation[];
  status:       'compliant' | 'partial' | 'critical';
}

export interface ComplianceReport {
  generatedAt:       string;
  /** Versione del report per tracciabilità */
  version:           string;
  /** Score globale (weighted) */
  globalScore:       number;
  /** True se PA-ready (score >= 80, no critical) */
  paReady:          boolean;
  /** Sezione GDPR */
  gdpr:              FrameworkSection;
  /** Sezione AI Act */
  aiAct:             FrameworkSection;
  /** Sezione AgID / CAD */
  agid:              FrameworkSection;
  /** DPIA draft */
  dpiaStatus:        'generated' | 'approved' | 'missing';
  dpiaTotalRisks:   number;
  dpiaOpenRisks:    number;
  /** Readiness score (da certificationPackage) */
  readinessScore:    number;
  /** Gap aperti */
  openGaps:          number;
  /** Scenari audit simulati */
  auditScenarios:    Array<{ id: string; label: string; score: number; passed: boolean }>;
  /** Azioni di remediation prioritarie */
  topRemediations:   string[];
  /** Riepilogo testuale per gare / audit */
  summary:           string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function frameworkStatus(score: number, hasViolations: boolean): FrameworkSection['status'] {
  if (!hasViolations && score >= 80) return 'compliant';
  if (score >= 60)                    return 'partial';
  return 'critical';
}

function buildSummary(report: Omit<ComplianceReport, 'summary'>): string {
  const paLabel = report.paReady ? 'PA-READY' : 'NON PA-READY';
  const lines = [
    `=== REPORT COMPLIANCE — DocenteDoc AI ===`,
    `Data: ${new Date(report.generatedAt).toLocaleDateString('it-IT', { dateStyle: 'long' })}`,
    `Score globale: ${report.globalScore}% — Stato: ${paLabel}`,
    ``,
    `GDPR Art. 5-46: ${report.gdpr.score}% (${report.gdpr.passed}/${report.gdpr.total} regole) — ${report.gdpr.status.toUpperCase()}`,
    `AI Act Titolo III: ${report.aiAct.score}% (${report.aiAct.passed}/${report.aiAct.total} regole) — ${report.aiAct.status.toUpperCase()}`,
    `AgID/CAD: ${report.agid.score}% (${report.agid.passed}/${report.agid.total} regole) — ${report.agid.status.toUpperCase()}`,
    ``,
    `DPIA: ${report.dpiaStatus === 'generated' ? 'Draft generato' : report.dpiaStatus === 'approved' ? 'Approvata' : 'Mancante'} — Rischi aperti: ${report.dpiaOpenRisks}/${report.dpiaTotalRisks}`,
    `Readiness score PA: ${report.readinessScore}%  |  Gap aperti: ${report.openGaps}`,
    ``,
    `TOP REMEDIATION:`,
    ...report.topRemediations.map((r, i) => `  ${i + 1}. ${r}`),
  ];
  return lines.join('\n');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Genera il report compliance completo.
 *
 * @param includeScenarios - se true, esegue tutti gli scenari di simulazione
 *   (più lento) — default false (solo production_live).
 */
export function generateComplianceReport(includeScenarios = false): ComplianceReport {
  slog.info('COMPLIANCE', 'Generazione report compliance avviata');

  // 1. Live compliance evaluation
  const db     = useComplianceStore.getState().db;
  const ctx    = buildContext(db);
  const result = evaluateAllRules(ctx);

  // 2. Per-framework breakdown
  const buildSection = (fw: RuleFramework): FrameworkSection => {
    const fs       = result.frameworkScores[fw];
    const viol     = result.violations.filter((v) => v.framework === fw);
    const critical = viol.some((v) => v.severity === 'critical');
    return {
      framework:  fw,
      label:      fw === 'GDPR' ? 'GDPR Art. 5-46' : fw === 'AI_ACT' ? 'AI Act Titolo III' : 'AgID / CAD',
      score:      Math.round(fs.score),
      passed:     fs.passed,
      total:      fs.total,
      violations: viol,
      status:     frameworkStatus(fs.score, critical),
    };
  };

  const gdprSection  = buildSection('GDPR');
  const aiActSection = buildSection('AI_ACT');
  const agidSection  = buildSection('AGID');

  // 3. DPIA
  const dpia         = generateDPIA();
  const totalRisks   = dpia.risks.length;
  const openRisks    = dpia.risks.filter((r) => r.status === 'planned').length;

  // 4. Certification package (readiness + gap analysis)
  let readinessScore = 0;
  let openGaps       = 0;
  try {
    const pkg: CertificationPackage = generateCertificationPackage();
    readinessScore = Math.round(pkg.certificationScore.total);
    openGaps       = pkg.gapAnalysis.missingCount + pkg.gapAnalysis.partialCount;
  } catch {
    slog.warn('COMPLIANCE', 'Impossibile generare certificationPackage');
  }

  // 5. Audit scenarios
  const scenariosToRun = includeScenarios
    ? AUDIT_SCENARIOS
    : AUDIT_SCENARIOS.filter((s) => s.id === 'production_live');

  const auditScenarios = scenariosToRun.map((scenario) => {
    try {
      const r = runAuditSimulation(db, scenario.id);
      return {
        id:     scenario.id,
        label:  scenario.label,
        score:  r.overallScore,
        passed: r.complianceStatus === 'CONFORME',
      };
    } catch {
      return { id: scenario.id, label: scenario.label, score: 0, passed: false };
    }
  });

  // 6. Top remediations
  const topRemediations = result.violations
    .filter((v) => v.severity === 'critical' || v.severity === 'high')
    .slice(0, 5)
    .map((v) => v.suggestedFix ?? v.message);

  // Add DPIA remediation if needed
  if (openRisks > 0) {
    topRemediations.push(`Risolvere ${openRisks} rischi DPIA in stato "planned".`);
  }
  if (openGaps > 0) {
    topRemediations.push(`Completare ${openGaps} gap di conformità nel certification package.`);
  }

  const partial: Omit<ComplianceReport, 'summary'> = {
    generatedAt:    new Date().toISOString(),
    version:        '2026.1',
    globalScore:    Math.round(result.liveScore),
    paReady:        result.compliant,
    gdpr:           gdprSection,
    aiAct:          aiActSection,
    agid:           agidSection,
    dpiaStatus:     openRisks === 0 ? 'approved' : 'generated',
    dpiaTotalRisks: totalRisks,
    dpiaOpenRisks:  openRisks,
    readinessScore,
    openGaps,
    auditScenarios,
    topRemediations,
  };

  const report: ComplianceReport = { ...partial, summary: buildSummary(partial) };

  slog.info('COMPLIANCE', 'Report compliance generato', {
    globalScore: report.globalScore,
    paReady: report.paReady,
    openGaps,
  });

  return report;
}

/**
 * Esporta il report compliance come testo plain (per gare / email).
 */
export function exportReportAsText(report: ComplianceReport): string {
  return report.summary;
}

/**
 * Esporta il report compliance come JSON (per archivi / audit trail).
 */
export function exportReportAsJSON(report: ComplianceReport): string {
  return JSON.stringify(report, null, 2);
}
