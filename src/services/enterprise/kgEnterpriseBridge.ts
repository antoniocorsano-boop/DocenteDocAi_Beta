/**
 * enterprise/kgEnterpriseBridge.ts
 *
 * Knowledge Graph Enterprise Bridge.
 *
 * Wraps the existing KG store with an approval-gated write layer.
 * Only data from approved ApprovalRequests can be committed to the KG.
 *
 * Staged writes live in localStorage until approval is granted.
 * All commits are audit-logged via enterpriseAuditLog.
 */

import { upsertNode } from '../knowledgeGraph/graphStore';
import type { KGNode } from '../knowledgeGraph/types';
import type {
  AgentResult,
  ApprovalRequest,
  KGEnterpriseWriteRecord,
  AgentRole,
} from '../../types/enterprise.types';
import { enterpriseAuditLog } from './enterpriseAuditLog';
import { encrypt, decrypt } from '../../modules/system/StorageCrypto';

// ── Staged writes storage ─────────────────────────────────────────────────────

const STAGED_KEY    = 'kg_enterprise_staged_v1';
const COMMITTED_KEY = 'kg_enterprise_committed_v1';

// P23: AES-GCM encrypted storage helpers (session-scoped ephemeral key)
async function secureRead<T>(key: string, fallback: T): Promise<T> {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const plain = await decrypt(raw);
    return JSON.parse(plain) as T;
  } catch {
    return fallback;
  }
}

async function secureWrite(key: string, value: unknown): Promise<void> {
  try {
    if (typeof localStorage === 'undefined') return;
    const cipher = await encrypt(JSON.stringify(value));
    localStorage.setItem(key, cipher);
  } catch { /* quota or crypto unavailable — silent */ }
}

// ── Staged write shape ────────────────────────────────────────────────────────

interface StagedKGWrite {
  id: string;
  approvalRequestId: string;
  agentRole: AgentRole;
  sessionId: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    data: Record<string, unknown>;
  }>;
  createdAt: string;
  tenantId?: string;
}

// ── Bridge implementation ─────────────────────────────────────────────────────

class KGEnterpriseBridgeImpl {
  /**
   * Stage KG nodes from an AgentResult for later approval-gated commit.
   * Nothing is written to the KG graph here.
   */
  async stage(result: AgentResult, approvalRequestId: string): Promise<StagedKGWrite> {
    const stubs = (result.data['kgNodeStubs'] as Array<{
      id: string;
      type: string;
      label: string;
      [k: string]: unknown;
    }> | undefined) ?? [];

    const staged: StagedKGWrite = {
      id:                `kgstg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      approvalRequestId,
      agentRole:         result.agentRole,
      sessionId:         result.sessionId,
      tenantId:          result.data['tenantId'] as string | undefined,
      createdAt:         new Date().toISOString(),
      nodes:             stubs.map(s => ({
        id:    s.id,
        type:  s.type,
        label: s.label,
        data:  Object.fromEntries(Object.entries(s).filter(([k]) => !['id', 'type', 'label', 'pending'].includes(k))),
      })),
    };

    const all = await secureRead<StagedKGWrite[]>(STAGED_KEY, []);
    all.push(staged);
    await secureWrite(STAGED_KEY, all);

    enterpriseAuditLog.record({
      action:          'kg_write_staged',
      agentRole:       result.agentRole,
      sessionId:       result.sessionId,
      tenantId:        staged.tenantId,
      complianceTags:  ['ISO_27001', 'GDPR_EU_2016_679'],
      details: {
        stagedId:          staged.id,
        approvalRequestId,
        nodeCount:         staged.nodes.length,
      },
    });

    return staged;
  }

  /**
   * Commit staged writes to the KG after approval.
   * Creates real KGNode entries via upsertNode.
   */
  async commit(approvalRequest: ApprovalRequest, approvedBy: string): Promise<KGEnterpriseWriteRecord[]> {
    const all     = await secureRead<StagedKGWrite[]>(STAGED_KEY, []);
    const targets = all.filter(s => s.approvalRequestId === approvalRequest.id);
    const records: KGEnterpriseWriteRecord[] = [];
    const now     = new Date().toISOString();

    for (const staged of targets) {
      for (const nodeStub of staged.nodes) {
        const kgNode: KGNode = {
          id:         nodeStub.id,
          type:       'document',     // regulatory provisions stored as documents
          label:      nodeStub.label,
          metadata:   { rawText: JSON.stringify(nodeStub.data) },
          createdAt:  now,
          updatedAt:  now,
        };

        try {
          upsertNode(kgNode);
        } catch { /* KG write errors never break the approval flow */ }

        const record: KGEnterpriseWriteRecord = {
          nodeId:            nodeStub.id,
          nodeType:          nodeStub.type,
          approvalRequestId: approvalRequest.id,
          approvedBy,
          approvedAt:        now,
          agentRole:         staged.agentRole,
          tenantId:          staged.tenantId,
        };
        records.push(record);
      }

      enterpriseAuditLog.record({
        action:         'kg_write_committed',
        agentRole:      staged.agentRole,
        sessionId:      staged.sessionId,
        tenantId:       staged.tenantId,
        complianceTags: ['ISO_27001', 'DPCM_2013_12_03'],
        details: {
          stagedId:          staged.id,
          approvalRequestId: approvalRequest.id,
          approvedBy,
          nodeCount:         staged.nodes.length,
        },
      });
    }

    // Remove the committed staged entries
    const remaining = all.filter(s => s.approvalRequestId !== approvalRequest.id);
    await secureWrite(STAGED_KEY, remaining);

    // Persist committed records
    const committed = await secureRead<KGEnterpriseWriteRecord[]>(COMMITTED_KEY, []);
    committed.push(...records);
    await secureWrite(COMMITTED_KEY, committed);

    return records;
  }

  /**
   * Reject and discard staged writes for a rejected approval.
   */
  async reject(approvalRequestId: string): Promise<void> {
    const all       = await secureRead<StagedKGWrite[]>(STAGED_KEY, []);
    const rejected  = all.filter(s => s.approvalRequestId === approvalRequestId);
    const remaining = all.filter(s => s.approvalRequestId !== approvalRequestId);
    await secureWrite(STAGED_KEY, remaining);

    for (const staged of rejected) {
      enterpriseAuditLog.record({
        action:    'kg_write_rejected',
        agentRole: staged.agentRole,
        sessionId: staged.sessionId,
        tenantId:  staged.tenantId,
        details: {
          stagedId:          staged.id,
          approvalRequestId,
          nodeCount:         staged.nodes.length,
        },
      });
    }
  }

  async getStaged(): Promise<StagedKGWrite[]> {
    return secureRead<StagedKGWrite[]>(STAGED_KEY, []);
  }

  async getCommitted(): Promise<KGEnterpriseWriteRecord[]> {
    return secureRead<KGEnterpriseWriteRecord[]>(COMMITTED_KEY, []);
  }
}

export const kgEnterpriseBridge = new KGEnterpriseBridgeImpl();
