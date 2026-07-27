/**
 * enterprise/orchestrator.ts
 *
 * CopilotDoc Enterprise Workflow Orchestrator.
 *
 * Implements the full agent pipeline from the diagram:
 *
 *   [Input Documents] → RegulatoryAgent (parse & analyse)
 *       ↓
 *   [ApprovalGate] ← Human-in-the-loop (critical step)
 *       ↓
 *   [KG Enterprise Bridge] ← approved write
 *       ↓
 *   [Specialized Agents] → Artistic | Analytics | Financial | Technical
 *       ↓
 *   [Multi-level Dashboards & Insights]
 *       ↓
 *   [Soft / Critical Automations]
 *
 * Security layer:
 *   - All KG writes gated by ApprovalGate
 *   - All agent executions and approvals logged via enterpriseAuditLog
 *   - AI keys never exposed to this layer (Vercel Edge proxy only)
 *   - Soft automations execute immediately; Critical require HITL
 */

import type {
  RegulatoryDocument,
  AgentResult,
  DashboardInsight,
  EnterpriseWorkflowSession,
  EnterpriseAutomationAction,
  ApprovalLevel,
} from '../../types/enterprise.types';
import { regulatoryAgent }         from './regulatoryAgent';
import { approvalGate }            from './approvalGate';
import { kgEnterpriseBridge }      from './kgEnterpriseBridge';
import { enterpriseAuditLog }      from './enterpriseAuditLog';
import { generateComplianceReport } from './complianceManifest';
import { artisticCulturalAgent }   from './agents/artisticCulturalAgent';
import { analyticsAgent }          from './agents/analyticsAgent';
import { financialAgent }          from './agents/financialAgent';
import { technicalAgent }          from './agents/technicalAgent';
import { decisionMemory }          from '../../cognition/decisionMemory';
import { trackUseCase }            from '../../cognition/useCaseTelemetry';

// ── Helpers ───────────────────────────────────────────────────────────────────

function nanoid(): string {
  return `wfs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

class EnterpriseOrchestratorImpl {
  /**
   * STEP 1 — Process a regulatory document through the full pipeline.
   *
   * Returns a workflow session containing:
   *   - Regulatory parse result
   *   - ApprovalRequest (pending human approval)
   *   - Staged KG write (committed only after approval)
   */
  async processRegulatoryDocument(doc: RegulatoryDocument): Promise<EnterpriseWorkflowSession> {
    const sessionId = nanoid();

    trackUseCase('UC-R5', 'started', 0, { documentId: doc.id, source: doc.source });

    enterpriseAuditLog.record({
      action:    'agent_started',
      agentRole: 'regulatory',
      sessionId,
      tenantId:  doc.tenantId,
      details:   { documentId: doc.id, source: doc.source, title: doc.title },
    });

    // ── Stage 1: Regulatory Agent parse ─────────────────────────────────────
    const regulatoryResult = regulatoryAgent.parse(doc);

    enterpriseAuditLog.record({
      action:         'agent_completed',
      agentRole:      'regulatory',
      sessionId,
      tenantId:       doc.tenantId,
      complianceTags: regulatoryResult.normativeRefs?.map(r => r.standard) ?? [],
      details: {
        normsFound:   regulatoryResult.data['normsFound'],
        sectionCount: regulatoryResult.data['sectionCount'],
      },
    });

    // ── Stage 2: Submit to ApprovalGate ──────────────────────────────────────
    const approvalLevel: ApprovalLevel = regulatoryResult.approvalLevel ?? 'segreteria';

    const approvalRequest = approvalGate.submit({
      title:         `Approvazione: ${doc.title}`,
      description:   regulatoryResult.summary,
      requiredLevel: approvalLevel,
      approvalChain: this._buildApprovalChain(approvalLevel),
      payload:       regulatoryResult.data,
      kgImpact:      regulatoryResult.data['normsFound'] as number > 3 ? 'major' : 'minor',
      normativeRefs: regulatoryResult.normativeRefs,
      tenantId:      doc.tenantId,
    });

    enterpriseAuditLog.record({
      action:         'approval_submitted',
      approvalLevel,
      sessionId,
      tenantId:       doc.tenantId,
      complianceTags: ['ISO_27001', 'GDPR_EU_2016_679'],
      details: {
        approvalRequestId: approvalRequest.id,
        kgImpact:          approvalRequest.kgImpact,
        requiredLevel:     approvalLevel,
      },
    });

    // ── Stage 3: Stage KG writes (not committed until approved) ──────────────
    await kgEnterpriseBridge.stage(regulatoryResult, approvalRequest.id);

    const session: EnterpriseWorkflowSession = {
      id:               sessionId,
      startedAt:        new Date().toISOString(),
      document:         doc,
      regulatoryResult,
      approvalRequest,
      agentResults:     [],
      dashboardInsights: [],
      automationActions: [],
      tenantId:         doc.tenantId,
    };

    // ── Emit signal to DecisionMemory ──────────────────────────────────────────
    decisionMemory.emitSignal({
      type:        'NEW_DOCUMENT',
      severity:    regulatoryResult.ok ? 'info' : 'warning',
      message:     `Documento normativo elaborato: ${doc.title}`,
      sourceAgent: 'regulatory',
      tenantId:    doc.tenantId,
      sessionId,
    });
    decisionMemory.addActiveFlow(sessionId);

    return session;
  }

  /**
   * STEP 2 — Run specialized agent pipeline after KG approval.
   * Called once the human approves the ApprovalRequest from step 1.
   *
   * Returns updated session with all agent results and automation actions.
   */
  async runAgentPipeline(
    session: EnterpriseWorkflowSession,
    approvedBy: string,
  ): Promise<EnterpriseWorkflowSession> {
    const { approvalRequest } = session;
    if (!approvalRequest) return session;

    // Commit approved KG writes
    const kgRecords = await kgEnterpriseBridge.commit(approvalRequest, approvedBy);

    trackUseCase('UC-R5', 'evidence_created', 2, {
      approvalRequestId: approvalRequest.id,
      approvedBy,
      kgNodesCommitted: kgRecords.length,
    });

    enterpriseAuditLog.record({
      action:         'approval_resolved',
      approvalLevel:  approvalRequest.requiredLevel,
      sessionId:      session.id,
      tenantId:       session.tenantId,
      complianceTags: ['ISO_27001', 'DPCM_2013_12_03'],
      details: {
        approvalRequestId: approvalRequest.id,
        approvedBy,
        kgNodesCommitted:  kgRecords.length,
      },
    });

    // ── Run all specialized agents ────────────────────────────────────────────
    const agentResults: AgentResult[] = [];
    const allInsights:  DashboardInsight[] = [];

    const agents: Array<{ role: string; run: () => AgentResult }> = [
      { role: 'artistic_cultural', run: () => artisticCulturalAgent.run({ tenantId: session.tenantId }) },
      { role: 'analytics',        run: () => analyticsAgent.run({ tenantId: session.tenantId }) },
      { role: 'financial',        run: () => financialAgent.run({ tenantId: session.tenantId }) },
      { role: 'technical',        run: () => technicalAgent.run({ tenantId: session.tenantId }) },
    ];

    for (const agent of agents) {
      enterpriseAuditLog.record({
        action:    'agent_started',
        agentRole: agent.role as AgentResult['agentRole'],
        sessionId: session.id,
        tenantId:  session.tenantId,
        details:   {},
      });

      let result: AgentResult;
      try {
        result = agent.run();
      } catch (e) {
        enterpriseAuditLog.record({
          action:    'agent_failed',
          agentRole: agent.role as AgentResult['agentRole'],
          sessionId: session.id,
          tenantId:  session.tenantId,
          details:   { error: String(e) },
        });
        continue;
      }

      agentResults.push(result);
      allInsights.push(...(result.data['insights'] as DashboardInsight[] ?? []));

      enterpriseAuditLog.record({
        action:    'agent_completed',
        agentRole: agent.role as AgentResult['agentRole'],
        sessionId: session.id,
        tenantId:  session.tenantId,
        details:   { summary: result.summary },
      });
    }

    // ── Build automation actions ──────────────────────────────────────────────
    const automationActions = this._buildAutomationActions(agentResults, session.id);
    // ── Emit signals to DecisionMemory from agent results ──────────────────────
    for (const result of agentResults) {
      if (result.agentRole === 'analytics' && (result.data['atRiskCount'] as number) > 0) {
        decisionMemory.emitSignal({
          type:        'PERFORMANCE_ALERT',
          severity:    'critical',
          message:     `${result.data['atRiskCount']} studenti a rischio rilevati dall'agente Analytics`,
          sourceAgent: 'analytics',
          tenantId:    session.tenantId,
          sessionId:   session.id,
        });
      }
      if (result.agentRole === 'technical' && !result.ok) {
        decisionMemory.emitSignal({
          type:        'INTEGRATION_ERROR',
          severity:    'warning',
          message:     result.summary,
          sourceAgent: 'technical',
          tenantId:    session.tenantId,
          sessionId:   session.id,
        });
      }
    }
    if ((session.regulatoryResult?.normativeRefs?.length ?? 0) > 0) {
      decisionMemory.emitSignal({
        type:        'COMPLIANCE_UPDATE',
        severity:    'info',
        message:     `Aggiornamento compliance da: ${session.document.title}`,
        sourceAgent: 'regulatory',
        tenantId:    session.tenantId,
        sessionId:   session.id,
      });
    }
    decisionMemory.removeActiveFlow(session.id);
    return {
      ...session,
      completedAt:      new Date().toISOString(),
      agentResults,
      dashboardInsights: allInsights,
      automationActions,
    };
  }

  /**
   * Generate a compliance status report for the current session / tenant.
   */
  async getComplianceReport(tenantId?: string) {
    const allLogs       = enterpriseAuditLog.getAll().filter(e => !tenantId || e.tenantId === tenantId);
    const _allRequests  = approvalGate.getAllRequests().filter(r => !tenantId || r.tenantId === tenantId);
    const committed     = (await kgEnterpriseBridge.getCommitted()).filter(r => !tenantId || r.tenantId === tenantId);
    const pending       = approvalGate.getPendingCount();

    return generateComplianceReport(allLogs.length, committed.length, pending);
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private _buildApprovalChain(requiredLevel: ApprovalLevel): ApprovalLevel[] {
    const LEVELS: ApprovalLevel[] = ['segreteria', 'dirigente', 'ministry', 'governo'];
    const idx = LEVELS.indexOf(requiredLevel);
    return LEVELS.slice(0, idx + 1);
  }

  private _buildAutomationActions(
    results: AgentResult[],
    sessionId: string,
  ): EnterpriseAutomationAction[] {
    const actions: EnterpriseAutomationAction[] = [];
    const now = new Date().toISOString();

    for (const result of results) {
      if (!result.ok) continue;

      // Soft automations — immediate, no approval needed
      if (result.recommendations && result.recommendations.length > 0) {
        actions.push({
          id:              `act_soft_${nanoid()}`,
          tier:            'soft',
          title:           `Notifica: ${result.recommendations[0].slice(0, 60)}`,
          description:     result.recommendations[0],
          requiresApproval: false,
          triggeredByAgent: result.agentRole,
          createdAt:       now,
          status:          'executed',
        });
        enterpriseAuditLog.record({
          action:    'automation_soft_triggered',
          agentRole: result.agentRole,
          sessionId,
          details:   { recommendation: result.recommendations[0] },
        });
      }

      // Critical automations — requires HITL for analytics (student risk) and financial (budget exceeded)
      const needsCritical =
        (result.agentRole === 'analytics' && (result.data['atRiskCount'] as number) > 0) ||
        (result.agentRole === 'financial' && (result.data['utilizationPct'] as number) > 90);

      if (needsCritical) {
        actions.push({
          id:              `act_crit_${nanoid()}`,
          tier:            'critical',
          title:           result.agentRole === 'analytics'
            ? 'Azione correttiva studenti a rischio — approvazione richiesta'
            : 'Revisione budget critica — approvazione Dirigente richiesta',
          description:     result.summary,
          requiresApproval: true,
          approvalLevel:   result.agentRole === 'financial' ? 'dirigente' : 'segreteria',
          triggeredByAgent: result.agentRole,
          createdAt:       now,
          status:          'pending',
        });
        enterpriseAuditLog.record({
          action:    'automation_critical_triggered',
          agentRole: result.agentRole,
          sessionId,
          details:   { reason: result.summary },
        });
      }
    }

    return actions;
  }
}

export const enterpriseOrchestrator = new EnterpriseOrchestratorImpl();
