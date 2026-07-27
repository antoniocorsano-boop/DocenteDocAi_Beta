// types.ts
// Tipi condivisi per Self-Compliance Engine

// ── Primitivi condivisi ───────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

// ── Activity ─────────────────────────────────────────────────────────────────

export type SystemActivity = {
  id: string;
  timestamp: string;
  actionType: string;
  approved: boolean;
  riskLevel: RiskLevel;
  explainable: boolean;
  gdprViolation?: boolean;
  blocked?: boolean;
  userOverride?: boolean;
  decisionTimeMs?: number;
};

// ── Metriche ─────────────────────────────────────────────────────────────────

export type ComplianceMetrics = {
  totalActions: number;
  autonomousActions: number;
  approvedActions: number;
  blockedActions: number;
  lowRiskActions: number;
  mediumRiskActions: number;
  highRiskActions: number;
  criticalRiskActions: number;
  gdprViolations: number;
  avgDecisionTime: number;
  userOverrides: number;
  explainabilityCoverage: number;
};

// ── Risk ─────────────────────────────────────────────────────────────────────

export type RiskAlert = {
  id: string;
  type: string;
  severity: RiskLevel;
  message: string;
  timestamp: string;
};

// ── Compliance evaluation ────────────────────────────────────────────────────

export type ComplianceStatus = "compliant" | "warning" | "non_compliant";

export type ComplianceEvaluation = {
  complianceStatus: ComplianceStatus;
  issues: string[];
  recommendations: string[];
  requiredActions: string[];
  confidenceScore: number;
};

// ── Report ───────────────────────────────────────────────────────────────────

export type RiskDistribution = {
  riskLevel: RiskLevel;
  count: number;
};

export type ComplianceReport = {
  id: string;
  period: string;
  generatedAt: string;
  systemStatus: ComplianceStatus;
  metrics: ComplianceMetrics;
  incidents: string[];
  correctiveActions: string[];
  riskDistribution: RiskDistribution[];
  explainabilityScore: number;
  standards: string[];
};

// ── Export ───────────────────────────────────────────────────────────────────

export type AuditExport = {
  json: string;
  pdf?: string;
  apiUrl?: string;
};

export type OpenDataExport = {
  system: string;
  period: string;
  generatedAt: string;
  metrics: {
    automationRate: number;
    approvalRate: number;
    explainabilityRate: number;
    riskLevel: RiskLevel;
    totalActions: number;
  };
  standards: string[];
};

// ── DB schema ────────────────────────────────────────────────────────────────

export type ComplianceSnapshot = {
  id: string;
  timestamp: string;
  metrics: ComplianceMetrics;
  evaluation: ComplianceEvaluation;
};

export type ComplianceDb = {
  activities: SystemActivity[];
  reports: ComplianceReport[];
  riskAlerts: RiskAlert[];
  snapshots: ComplianceSnapshot[];
  version: number;
};
