/**
 * enterprise/index.ts — Public API barrel for CopilotDoc Enterprise.
 *
 * Import from here, not from sub-modules directly.
 *
 * Quick reference:
 *
 *   Orchestrator (full pipeline):
 *     processRegulatoryDocument(doc)   → EnterpriseWorkflowSession (pending approval)
 *     runAgentPipeline(session, by)    → EnterpriseWorkflowSession (completed)
 *     getComplianceReport(tenantId?)   → ComplianceReport
 *
 *   Approval gate (HITL):
 *     approvalGate.submit(params)                              → ApprovalRequest
 *     approvalGate.resolve(id, level, decision, by, notes?)   → ApprovalResolution | null
 *     approvalGate.getPending()                               → ApprovalRequest[]
 *     approvalGate.onApprovalRequired(listener)               → unsubscribe fn
 *     approvalGate.onResolution(listener)                     → unsubscribe fn
 *
 *   KG Enterprise (staged writes):
 *     kgEnterpriseBridge.stage(result, approvalReqId)   → StagedKGWrite
 *     kgEnterpriseBridge.commit(approvalReq, by)        → KGEnterpriseWriteRecord[]
 *     kgEnterpriseBridge.reject(approvalReqId)          → void
 *
 *   Regulatory agent:
 *     regulatoryAgent.parse(doc)       → AgentResult
 *
 *   Specialized agents (direct access):
 *     artisticCulturalAgent.run(ctx)   → AgentResult
 *     analyticsAgent.run(ctx)          → AgentResult
 *     financialAgent.run(ctx)          → AgentResult
 *     technicalAgent.run(ctx)          → AgentResult
 *
 *   Audit log:
 *     enterpriseAuditLog.record(entry)   → void
 *     enterpriseAuditLog.getAll()        → EnterpriseAuditEntry[]
 *     enterpriseAuditLog.export()        → JSON string
 *
 *   Compliance manifest:
 *     COMPLIANCE_MANIFEST                → Record<ComplianceStandard, …>
 *     getMandatoryStandards()            → ComplianceStandard[]
 *     generateComplianceReport(…)        → ComplianceReport
 */

// ── Orchestrator ──────────────────────────────────────────────────────────────
export { enterpriseOrchestrator } from './orchestrator';

// ── Approval Gate ─────────────────────────────────────────────────────────────
export { approvalGate }           from './approvalGate';
export type { ApprovalListener, ResolutionListener } from './approvalGate';

// ── KG Bridge ─────────────────────────────────────────────────────────────────
export { kgEnterpriseBridge }     from './kgEnterpriseBridge';

// ── Agents ────────────────────────────────────────────────────────────────────
export { regulatoryAgent }        from './regulatoryAgent';
export { artisticCulturalAgent }  from './agents/artisticCulturalAgent';
export { analyticsAgent }         from './agents/analyticsAgent';
export { financialAgent }         from './agents/financialAgent';
export { technicalAgent }         from './agents/technicalAgent';

// ── Audit & Compliance ────────────────────────────────────────────────────────
export { enterpriseAuditLog }     from './enterpriseAuditLog';
export {
  COMPLIANCE_MANIFEST,
  getMandatoryStandards,
  getAllNormativeRefs,
  generateComplianceReport,
}                                 from './complianceManifest';

// ── Types (re-export for consumers) ──────────────────────────────────────────
export type {
  RegulatoryDocument,
  RegulatoryDocumentSource,
  AgentRole,
  AgentResult,
  AgentCapability,
  ApprovalRequest,
  ApprovalResolution,
  ApprovalLevel,
  ApprovalStatus,
  NormativeReference,
  ComplianceStandard,
  ComplianceReport,
  DashboardInsight,
  DashboardLevel,
  AutomationTier,
  EnterpriseAutomationAction,
  EnterpriseWorkflowSession,
  KGEnterpriseWriteRecord,
}                                 from '../../types/enterprise.types';
