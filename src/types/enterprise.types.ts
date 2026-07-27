/**
 * enterprise.types.ts
 *
 * Domain types for CopilotDoc Enterprise multi-agent workflow.
 *
 * Architecture layers:
 *   Input Documents → RegulatoryAgent → ApprovalGate → KG Enterprise
 *   → Specialized Agents → Multi-level Dashboards → Soft/Critical Automations
 */

// ── Input sources ─────────────────────────────────────────────────────────────

export type RegulatoryDocumentSource =
  | 'miur'
  | 'government'
  | 'official_record'
  | 'circular'
  | 'ministerial_decree';

export interface RegulatoryDocument {
  id: string;
  source: RegulatoryDocumentSource;
  title: string;
  rawText: string;
  issuedAt?: string;
  referenceCode?: string;
  tenantId?: string;
}

// ── Normative references ──────────────────────────────────────────────────────

export type ComplianceStandard =
  | 'GDPR_EU_2016_679'
  | 'D_LGS_196_2003'
  | 'ISO_27001'
  | 'ISO_9001'
  | 'AGID'
  | 'DPCM_2013_12_03'     // Conservazione digitale
  | 'D_LGS_82_2005'       // CAC / PEC / firma digitale
  | 'MIUR_GUIDELINES';

export interface NormativeReference {
  standard: ComplianceStandard;
  article?: string;
  description: string;
  mandatory: boolean;
}

// ── Approval levels ───────────────────────────────────────────────────────────

export type ApprovalLevel =
  | 'segreteria'  // level 1 — policy review
  | 'dirigente'   // level 2 — strategic approval
  | 'ministry'    // level 3 — regulation updates
  | 'governo';    // level 4 — macro analysis

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'deferred'
  | 'escalated';

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  requiredLevel: ApprovalLevel;
  /** Nested approval chain: each step must be satisfied in order */
  approvalChain: ApprovalLevel[];
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  /** The payload that will be applied if approved */
  payload: unknown;
  /** What kind of data will be written to KG on approval */
  kgImpact: 'none' | 'minor' | 'major' | 'critical';
  normativeRefs?: NormativeReference[];
  tenantId?: string;
}

export interface ApprovalResolution {
  requestId: string;
  level: ApprovalLevel;
  decision: 'approved' | 'rejected' | 'deferred';
  resolvedBy: string;
  resolvedAt: string;
  notes?: string;
}

// ── Agent roles ───────────────────────────────────────────────────────────────

export type AgentRole =
  | 'regulatory'
  | 'artistic_cultural'
  | 'analytics'
  | 'financial'
  | 'technical';

export interface AgentCapability {
  role: AgentRole;
  name: string;
  description: string;
  outputType: 'report' | 'suggestion' | 'kpi' | 'integration';
}

export interface AgentResult {
  agentRole: AgentRole;
  sessionId: string;
  producedAt: string;
  ok: boolean;
  summary: string;
  data: Record<string, unknown>;
  recommendations?: string[];
  normativeRefs?: NormativeReference[];
  kgNodes?: string[];     // IDs of KG nodes created/updated
  requiresApproval: boolean;
  approvalLevel?: ApprovalLevel;
}

// ── KG Enterprise provenance ──────────────────────────────────────────────────

export interface KGEnterpriseWriteRecord {
  nodeId: string;
  nodeType: string;
  approvalRequestId: string;
  approvedBy: string;
  approvedAt: string;
  agentRole: AgentRole;
  tenantId?: string;
}

// ── Dashboard & automations ───────────────────────────────────────────────────

export type DashboardLevel = ApprovalLevel;

export interface DashboardInsight {
  level: DashboardLevel;
  title: string;
  metric?: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  alert?: boolean;
  sources: AgentRole[];
}

export type AutomationTier = 'soft' | 'critical';

export interface EnterpriseAutomationAction {
  id: string;
  tier: AutomationTier;
  title: string;
  description: string;
  /** 'soft' executes immediately; 'critical' requires approval */
  requiresApproval: boolean;
  approvalLevel?: ApprovalLevel;
  triggeredByAgent: AgentRole;
  createdAt: string;
  executedAt?: string;
  status: 'pending' | 'executed' | 'rejected';
}

// ── Enterprise workflow session ───────────────────────────────────────────────

export interface EnterpriseWorkflowSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  document: RegulatoryDocument;
  regulatoryResult?: AgentResult;
  approvalRequest?: ApprovalRequest;
  approvalResolution?: ApprovalResolution;
  agentResults: AgentResult[];
  dashboardInsights: DashboardInsight[];
  automationActions: EnterpriseAutomationAction[];
  tenantId?: string;
}

// ── Compliance report ─────────────────────────────────────────────────────────

export interface ComplianceReport {
  generatedAt: string;
  standards: Array<{
    standard: ComplianceStandard;
    status: 'compliant' | 'partial' | 'unknown';
    notes: string;
  }>;
  auditLogSize: number;
  approvedChanges: number;
  pendingApprovals: number;
  lastAuditAt?: string;
}
