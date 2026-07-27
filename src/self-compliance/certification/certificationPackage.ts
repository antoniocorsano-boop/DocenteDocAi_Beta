// certification/certificationPackage.ts
// Orchestratore: genera il CertificationPackage completo

import { classifyAIActRisk } from "./aiActClassifier";
import { generateDPIA } from "./dpiaGenerator";
import { generateRiskAssessment } from "./riskAssessment";
import { generateGapAnalysis } from "./gapAnalyzer";
import { calculateReadinessScore } from "./readinessScorer";
import {
  generateTechnicalDocumentation,
  generateAISystemDescription,
  generateTransparencyStatement,
  generateAdminComplianceReport,
} from "./documentationDrafts";
import { defineOpenDataStrategy } from "./openDataStrategy";
import { buildContinuousComplianceModel } from "./continuousComplianceModel";
import type { CertificationPackage, CertificationPhase } from "./types";

function buildRoadmap(pathTo100: string[]): CertificationPhase[] {
  const phases: CertificationPhase[] = [
    {
      phase: 1,
      title: "Conformità Legale Immediata (0–4 settimane)",
      actions: [
        pathTo100[0] ?? "Stipulare DPA con provider LLM",
        pathTo100[1] ?? "Nominare DPO e approvare DPIA",
        pathTo100[2] ?? "Predisporre RoPA",
      ],
      estimatedWeeks: 4,
    },
    {
      phase: 2,
      title: "Documentazione e Registrazione AI Act (4–8 settimane)",
      actions: [
        pathTo100[3] ?? "Consenso minori GDPR Art. 8",
        pathTo100[4] ?? "Documentazione tecnica AI Act Art. 11",
        pathTo100[5] ?? "Registrazione database EU AI Act",
      ],
      estimatedWeeks: 4,
      prerequisite: "Fase 1 completata",
    },
    {
      phase: 3,
      title: "Governance e Formazione PA (8–16 settimane)",
      actions: [
        pathTo100[6] ?? "Piano formazione docenti PA",
        pathTo100[7] ?? "Audit accessibilità WCAG 2.1 AA",
        pathTo100[8] ?? "Procedura notifica incidenti",
      ],
      estimatedWeeks: 8,
      prerequisite: "Fase 2 completata",
    },
    {
      phase: 4,
      title: "Certificazione e Audit Indipendente (16–28 settimane)",
      actions: [
        pathTo100[9] ?? "Pentest e certificazione AgID",
        "Open data pubblicati su dati.gov.it",
        "Audit indipendente di conformità (opzionale)",
        "Dichiarazione di Conformità Annuale",
      ],
      estimatedWeeks: 12,
      prerequisite: "Fase 3 completata",
    },
  ];
  return phases;
}

function buildExecutiveSummary(
  score: ReturnType<typeof calculateReadinessScore>,
  gaps: number,
  missingCritical: number,
): string {
  const status =
    score.total >= 80
      ? "PRONTO PER IL DEPLOY"
      : score.total >= 60
        ? "CONFORMITÀ PARZIALE — Azioni richieste prima del deploy"
        : "NON PRONTO — Significative lacune normative da colmare";

  return (
    `DocenteDoc AI ha ottenuto un Certification Readiness Score di ${score.total}/100. ` +
    `Stato: ${status}. ` +
    `Sono stati identificati ${gaps} gap normativi, ` +
    `di cui ${missingCritical} critici senza mitigazione. ` +
    `Il sistema implementa correttamente i requisiti tecnici fondamentali dell'AI Act ` +
    `(supervisione umana, trasparenza, logging, explainability, risk management) ` +
    `ed è classificato come Sistema ad Alto Rischio ai sensi dell'Allegato III, punto 3(b). ` +
    `Le azioni prioritarie riguardano la dimensione legale-contrattuale: ` +
    `stipula DPA con i provider LLM, nomina del DPO, approvazione formale della DPIA, ` +
    `registrazione nel Registro delle Attività di Trattamento. ` +
    `Una volta completate le 4 fasi del piano di remediation (stimato: 28 settimane), ` +
    `il sistema sarà idoneo al deploy in produzione presso istituzioni scolastiche PA.`
  );
}

/** Genera il CertificationPackage completo. */
export function generateCertificationPackage(): CertificationPackage {
  const aiActClassification = classifyAIActRisk();
  const dpia = generateDPIA();
  const riskAssessment = generateRiskAssessment();
  const gapAnalysis = generateGapAnalysis();
  const certificationScore = calculateReadinessScore({
    aiActClassification,
    gapAnalysis,
    riskAssessment,
  });

  const documents = [
    generateTechnicalDocumentation(aiActClassification, certificationScore),
    generateAISystemDescription(),
    generateTransparencyStatement(),
    generateAdminComplianceReport(certificationScore),
  ];

  const openDataStrategy = defineOpenDataStrategy();
  const continuousComplianceModel = buildContinuousComplianceModel();
  const roadmap = buildRoadmap(certificationScore.pathTo100);

  const missingCritical = riskAssessment.risks.filter(
    r => r.severity === "critical" && r.mitigationStatus === "missing",
  ).length;

  const executiveSummary = buildExecutiveSummary(
    certificationScore,
    gapAnalysis.missingCount + gapAnalysis.partialCount,
    missingCritical,
  );

  return {
    id: `cert-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    systemName: "DocenteDoc AI",
    systemVersion: "1.0.0",
    aiActClassification,
    dpia,
    riskAssessment,
    gapAnalysis,
    certificationScore,
    documents,
    openDataStrategy,
    continuousComplianceModel,
    roadmap,
    executiveSummary,
  };
}
