// certification/types.ts
// Tipi condivisi per il Certification Package

// ── AI Act ────────────────────────────────────────────────────────────────────

export type AIActRiskTier =
  | "unacceptable" // Art. 5 — vietato
  | "high"         // All. III — obblighi stringenti
  | "limited"      // Art. 50 — obblighi di trasparenza
  | "minimal";     // nessun obbligo specifico

export type AIActObligation = {
  article: string;
  title: string;
  description: string;
  implemented: boolean;
  evidence?: string;
};

export type AIActClassification = {
  riskTier: AIActRiskTier;
  justification: string;
  annexIII_category?: string;
  obligations: AIActObligation[];
  isExempt: boolean;
  exemptionReason?: string;
};

// ── DPIA ─────────────────────────────────────────────────────────────────────

export type DataCategory = {
  name: string;
  subjects: string[];
  sensitivity: "ordinary" | "special" | "criminal";
  retentionDays: number;
  legalBasis: string;
};

export type DPIARisk = {
  id: string;
  threat: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  residualRisk: "low" | "medium" | "high";
  mitigation: string;
  status: "implemented" | "planned" | "missing";
};

export type DPIA = {
  version: string;
  date: string;
  systemName: string;
  controller: string;
  dpo: string;
  purpose: string[];
  dataCategories: DataCategory[];
  processingActivities: string[];
  risks: DPIARisk[];
  necessityTest: string;
  proportionalityTest: string;
  conclusion: "required" | "not_required";
  approvalStatus: "draft" | "pending" | "approved";
};

// ── Risk Assessment ───────────────────────────────────────────────────────────

export type RiskCategory = "technical" | "ethical" | "legal" | "operational";

export type SystemRisk = {
  id: string;
  category: RiskCategory;
  title: string;
  description: string;
  affectedComponent: string;
  severity: "low" | "medium" | "high" | "critical";
  mitigationStatus: "implemented" | "partial" | "missing";
  mitigationDescription: string;
  standard?: string;
};

export type AIRiskAssessment = {
  date: string;
  systemVersion: string;
  risks: SystemRisk[];
  overallRiskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
};

// ── Gap Analysis ──────────────────────────────────────────────────────────────

export type GapStatus = "compliant" | "partial" | "missing";

export type GapItem = {
  id: string;
  standard: string;
  article?: string;
  requirement: string;
  status: GapStatus;
  evidence?: string;
  action?: string;
  priority: "low" | "medium" | "high";
};

export type GapAnalysis = {
  date: string;
  standards: string[];
  items: GapItem[];
  compliantCount: number;
  partialCount: number;
  missingCount: number;
  complianceRate: number;
};

// ── Readiness Score ───────────────────────────────────────────────────────────

export type ReadinessDimension =
  | "governance"
  | "transparency"
  | "auditability"
  | "security"
  | "humanOversight"
  | "documentation"
  | "dataProtection";

export type ScoreBreakdown = Record<ReadinessDimension, number>;

export type CertificationScore = {
  total: number; // 0–100
  breakdown: ScoreBreakdown;
  gaps: string[];
  pathTo100: string[];
};

// ── Documentation ─────────────────────────────────────────────────────────────

export type DocumentSection = {
  title: string;
  content: string;
};

export type DocumentDraft = {
  type:
    | "technical_documentation"
    | "ai_system_description"
    | "transparency_statement"
    | "admin_compliance_report";
  version: string;
  date: string;
  sections: DocumentSection[];
};

// ── Open Data Strategy ────────────────────────────────────────────────────────

export type OpenDataDataset = {
  id: string;
  title: string;
  description: string;
  format: string;
  license: string;
  accrualPeriodicity: string;
  containsPersonalData: boolean;
  gdprSafe: boolean;
  dctTerms: {
    publisher: string;
    language: string;
    conformsTo: string;
  };
};

export type OpenDataStrategy = {
  generatedAt: string;
  platform: string;
  license: string;
  updateFrequency: string;
  gdprSafeGuarantees: string[];
  datasets: OpenDataDataset[];
  technicalNotes: string;
  contactPoint: string;
  catalogUrl: string;
};

// ── Continuous Compliance ─────────────────────────────────────────────────────

export type EscalationRule = {
  triggerCondition: string;
  severity: "critical" | "high" | "medium" | "low";
  escalationTarget: string;
  responseTimeHours: number;
  automatedAction: string;
};

export type AuditCycle = {
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  type: string;
  description: string;
  owner: string;
  artifacts: string[];
};

export type PAIntegration = {
  authority: string;
  obligation: string;
  deadline: string;
  status: "implemented" | "partial" | "missing";
};

export type MaturityLevel = {
  level: number;
  name: string;
  description: string;
  currentlyAt: boolean;
  requiredGaps: string[];
};

export type ContinuousComplianceModel = {
  generatedAt: string;
  auditCycles: AuditCycle[];
  escalationRules: EscalationRule[];
  integrationWithPA: PAIntegration[];
  maturityLevels: MaturityLevel[];
};

// ── Certification Package ─────────────────────────────────────────────────────

export type CertificationPhase = {
  phase: number;
  title: string;
  actions: string[];
  estimatedWeeks: number;
  prerequisite?: string;
};

export type CertificationPackage = {
  id: string;
  generatedAt: string;
  systemName: string;
  systemVersion: string;
  aiActClassification: AIActClassification;
  dpia: DPIA;
  riskAssessment: AIRiskAssessment;
  gapAnalysis: GapAnalysis;
  certificationScore: CertificationScore;
  documents: DocumentDraft[];
  openDataStrategy: OpenDataStrategy;
  continuousComplianceModel: ContinuousComplianceModel;
  roadmap: CertificationPhase[];
  executiveSummary: string;
};
