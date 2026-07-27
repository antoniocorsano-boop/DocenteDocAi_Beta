// certification/readinessScorer.ts
// Calcola il Certification Readiness Score (0–100)

import type { AIActClassification, GapAnalysis, AIRiskAssessment, CertificationScore, ScoreBreakdown, ReadinessDimension } from "./types";

type Inputs = {
  aiActClassification: AIActClassification;
  gapAnalysis: GapAnalysis;
  riskAssessment: AIRiskAssessment;
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, n)));
}

function scoreGapsByStandard(
  gapAnalysis: GapAnalysis,
  standard: string,
): number {
  const items = gapAnalysis.items.filter(i => i.standard === standard);
  if (items.length === 0) return 100;
  const points = items.reduce((acc, i) => {
    if (i.status === "compliant") return acc + 1;
    if (i.status === "partial")   return acc + 0.5;
    return acc;
  }, 0);
  return clamp((points / items.length) * 100);
}

export function calculateReadinessScore(inputs: Inputs): CertificationScore {
  const { aiActClassification, gapAnalysis, riskAssessment } = inputs;

  // ── Governance (AI Act obligations) ──────────────────────────────────────
  const obligationsDone  = aiActClassification.obligations.filter(o => o.implemented).length;
  const obligationsTotal = aiActClassification.obligations.length;
  const governance       = clamp((obligationsDone / obligationsTotal) * 100);

  // ── Transparency (Art.13, ExplainabilityPanel, open data) ────────────────
  const transparencyGaps = gapAnalysis.items.filter(
    i => ["Art. 13", "Art. 50"].includes(i.article ?? "") || i.id.includes("open"),
  );
  const transparencyOk = transparencyGaps.filter(i => i.status === "compliant").length;
  const transparency   = transparencyGaps.length > 0
    ? clamp((transparencyOk / transparencyGaps.length) * 100)
    : 85;

  // ── Auditability (logging, reporting, export) ─────────────────────────────
  const auditGaps = gapAnalysis.items.filter(
    i => ["Art. 12", "§ 9.1"].includes(i.article ?? ""),
  );
  const auditOk = auditGaps.filter(i => i.status === "compliant").length;
  const auditability = auditGaps.length > 0
    ? clamp((auditOk / auditGaps.length) * 100)
    : 80;

  // ── Security (ISO 27001, Art.15, data protection) ─────────────────────────
  const secGaps = gapAnalysis.items.filter(
    i => i.standard === "AgID" || ["Art. 15", "Art. 25", "Art. 28"].includes(i.article ?? ""),
  );
  const secOk = secGaps.filter(i => i.status === "compliant").length
    + secGaps.filter(i => i.status === "partial").length * 0.5;
  const security = secGaps.length > 0 ? clamp((secOk / secGaps.length) * 100) : 70;

  // ── Human Oversight (Art.14, ApprovalQueue) ───────────────────────────────
  const oversightGaps = gapAnalysis.items.filter(
    i => ["Art. 14", "Art. 26(6)"].includes(i.article ?? ""),
  );
  const oversightOk = oversightGaps.filter(i => i.status === "compliant").length
    + oversightGaps.filter(i => i.status === "partial").length * 0.5;
  const humanOversight = oversightGaps.length > 0
    ? clamp((oversightOk / oversightGaps.length) * 100)
    : 75;

  // ── Documentation (Art.11, DPIA, RoPA) ────────────────────────────────────
  const docGaps = gapAnalysis.items.filter(
    i => ["Art. 11", "Art. 35", "Art. 30", "Art. 37"].includes(i.article ?? ""),
  );
  const docOk = docGaps.filter(i => i.status === "compliant").length
    + docGaps.filter(i => i.status === "partial").length * 0.5;
  const documentation = docGaps.length > 0 ? clamp((docOk / docGaps.length) * 100) : 50;

  // ── Data Protection (GDPR wholistic) ─────────────────────────────────────
  const dataProtection = clamp(
    scoreGapsByStandard(gapAnalysis, "GDPR")
    - (riskAssessment.risks.filter(r => r.category === "legal" && r.mitigationStatus === "missing").length * 10),
  );

  const breakdown: ScoreBreakdown = {
    governance,
    transparency,
    auditability,
    security,
    humanOversight,
    documentation,
    dataProtection,
  };

  const weights: Record<ReadinessDimension, number> = {
    governance:      0.20,
    transparency:    0.15,
    auditability:    0.15,
    security:        0.15,
    humanOversight:  0.15,
    documentation:   0.10,
    dataProtection:  0.10,
  };

  const total = clamp(
    Object.entries(breakdown).reduce(
      (sum, [dim, score]) => sum + score * (weights[dim as ReadinessDimension] ?? 0),
      0,
    ),
  );

  // Penalità per rischi critici senza mitigazione
  const unmitCritical = riskAssessment.risks.filter(
    r => r.severity === "critical" && r.mitigationStatus === "missing",
  ).length;
  const penalizzato = clamp(total - unmitCritical * 15);

  // ── Gap list per raggiungere 100 ──────────────────────────────────────────
  const gaps: string[] = gapAnalysis.items
    .filter(i => i.status !== "compliant" && i.priority === "high")
    .map(i => `[${i.standard} ${i.article ?? ""}] ${i.requirement}`)
    .slice(0, 8);

  const pathTo100: string[] = [
    "Stipulare DPA con Google (Gemini) e Anthropic [GDPR Art. 28]",
    "Nominare DPO e approvare DPIA formalmente [GDPR Art. 37, 35]",
    "Predisporre Registro delle Attività di Trattamento (RoPA) [GDPR Art. 30]",
    "Implementare informativa e consenso per studenti minorenni [GDPR Art. 8, 13]",
    "Finalizzare documentazione tecnica AI Act [Art. 11]",
    "Completare registrazione database EU AI Act [Art. 49]",
    "Predisporre piano formazione PA [AI Act Art. 26(6)]",
    "Eseguire audit accessibilità WCAG 2.1 AA + dichiarazione AgID",
    "Implementare procedura notifica incidenti (Garante + AgID) [GDPR Art. 33, AI Act Art. 62]",
    "Eseguire pentest e certificazione misure sicurezza AgID [CAD Art. 32]",
  ];

  return { total: penalizzato, breakdown, gaps, pathTo100 };
}
