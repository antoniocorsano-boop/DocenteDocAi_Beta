// complianceBrain.ts
// Valuta conformità, classifica rischi, genera raccomandazioni

import type {
  ComplianceMetrics,
  RiskAlert,
  ComplianceEvaluation,
  ComplianceStatus,
} from "./types";

export function evaluateCompliance(
  metrics: ComplianceMetrics,
  risks: RiskAlert[],
): ComplianceEvaluation {
  const criticals = risks.filter(r => r.severity === "critical");
  const highs     = risks.filter(r => r.severity === "high");
  const mediums   = risks.filter(r => r.severity === "medium");

  // Status conservativo: prefer warning over false compliance
  let complianceStatus: ComplianceStatus = "compliant";
  if (criticals.length > 0 || metrics.gdprViolations > 0) {
    complianceStatus = "non_compliant";
  } else if (
    highs.length > 0 ||
    mediums.length > 0 ||
    metrics.explainabilityCoverage < 0.7
  ) {
    complianceStatus = "warning";
  }

  const issues = risks.map(r => `[${r.severity.toUpperCase()}] ${r.type}: ${r.message}`);

  const recommendations: string[] = [];
  if (metrics.gdprViolations > 0) {
    recommendations.push(
      "Investigare le violazioni GDPR: attivare procedura D.P.O. entro 72h (GDPR Art. 33)",
    );
  }
  if (metrics.explainabilityCoverage < 0.7) {
    recommendations.push(
      "Incrementare copertura spiegabilità AI: ogni azione ad alto impatto deve essere motivata (AI Act Art. 13)",
    );
  }
  if (metrics.approvedActions < metrics.highRiskActions) {
    recommendations.push(
      "Richiedere supervisione umana per tutte le azioni ad alto rischio (AI Act Art. 14)",
    );
  }
  if (metrics.userOverrides > metrics.totalActions * 0.3) {
    recommendations.push(
      "Rivedere la calibrazione del modello AI: alto tasso di override indica inaccuratezza",
    );
  }
  if (metrics.avgDecisionTime > 5000) {
    recommendations.push(
      "Ottimizzare la latenza delle decisioni AI: latenza > 5s può compromettere l'esperienza utente",
    );
  }

  const requiredActions: string[] = [];
  if (complianceStatus === "non_compliant") {
    requiredActions.push(
      "URGENTE: Sospendere le azioni autonome ad alto rischio in attesa di verifica",
    );
    requiredActions.push("Notificare DPO e responsabile del trattamento dati");
    requiredActions.push("Avviare incident response entro 72h (GDPR Art. 33)");
  } else if (complianceStatus === "warning") {
    requiredActions.push("Revisione preventiva delle configurazioni di rischio entro 48h");
    requiredActions.push("Comunicare anomalie al team di governance AI");
  }

  // Confidence: ridotto proporzionalmente alla severità dei problemi
  const issueWeight =
    criticals.length * 0.4 + highs.length * 0.2 + mediums.length * 0.1;
  const confidenceScore = Math.max(0, Math.min(1, 1 - issueWeight));

  return {
    complianceStatus,
    issues,
    recommendations,
    requiredActions,
    confidenceScore,
  };
}
