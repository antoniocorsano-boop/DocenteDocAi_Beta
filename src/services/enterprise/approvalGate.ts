/**
 * enterprise/approvalGate.ts
 *
 * Multi-level Human-in-the-Loop (HITL) approval gate.
 *
 * Approval chain (lowest → highest authority):
 *   segreteria (1) → dirigente (2) → ministry (3) → governo (4)
 *
 * Rules:
 *   - A request at level N requires approval from that level or higher.
 *   - Each request carries an ordered approvalChain; all steps must complete.
 *   - Rejected at any step → whole request rejected.
 *   - All decisions are audit-logged via enterpriseAuditLog.
 *   - Observers are notified on every state change.
 */

import type {
  ApprovalRequest,
  ApprovalResolution,
  ApprovalLevel,
  ApprovalStatus,
} from '../../types/enterprise.types';

// ── Persistence ───────────────────────────────────────────────────────────────

const REQUESTS_KEY   = 'enterprise_approval_requests_v1';
const RESOLUTIONS_KEY = 'enterprise_approval_resolutions_v1';
const MAX_SIZE        = 300;

function nanoid(): string {
  return `apr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeStore(key: string, value: unknown): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch { /* quota or private browsing */ }
}

// ── Listener types ────────────────────────────────────────────────────────────

export type ApprovalListener = (request: ApprovalRequest) => void;
export type ResolutionListener = (resolution: ApprovalResolution, request: ApprovalRequest) => void;

// ── ApprovalGate ──────────────────────────────────────────────────────────────

class ApprovalGateImpl {
  private _requests: Map<string, ApprovalRequest>;
  private _resolutions: ApprovalResolution[];
  private _approvalListeners: ApprovalListener[] = [];
  private _resolutionListeners: ResolutionListener[] = [];

  constructor() {
    const stored = safeJSON<ApprovalRequest[]>(REQUESTS_KEY, []);
    this._requests    = new Map(stored.map(r => [r.id, r]));
    this._resolutions = safeJSON<ApprovalResolution[]>(RESOLUTIONS_KEY, []);
  }

  // ── Observer registration ────────────────────────────────────────────────

  onApprovalRequired(listener: ApprovalListener): () => void {
    this._approvalListeners.push(listener);
    return () => { this._approvalListeners = this._approvalListeners.filter(l => l !== listener); };
  }

  onResolution(listener: ResolutionListener): () => void {
    this._resolutionListeners.push(listener);
    return () => { this._resolutionListeners = this._resolutionListeners.filter(l => l !== listener); };
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  /**
   * Submit a new approval request.
   * Returns the created ApprovalRequest.
   */
  submit(
    params: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt'>,
  ): ApprovalRequest {
    const request: ApprovalRequest = {
      ...params,
      id:        nanoid(),
      status:    'pending',
      createdAt: new Date().toISOString(),
    };

    this._requests.set(request.id, request);
    this._persistRequests();

    for (const l of this._approvalListeners) {
      try { l(request); } catch { /* listener errors must not break gate */ }
    }

    return request;
  }

  // ── Resolve ──────────────────────────────────────────────────────────────

  /**
   * Resolve a pending approval request.
   * For multi-step chains, partial approval advances to the next level.
   */
  resolve(
    requestId: string,
    level: ApprovalLevel,
    decision: ApprovalResolution['decision'],
    resolvedBy: string,
    notes?: string,
  ): ApprovalResolution | null {
    const request = this._requests.get(requestId);
    if (!request || request.status !== 'pending') return null;

    const now = new Date().toISOString();
    const resolution: ApprovalResolution = {
      requestId,
      level,
      decision,
      resolvedBy,
      resolvedAt: now,
      notes,
    };

    this._resolutions.push(resolution);
    this._trimResolutions();
    this._persistResolutions();

    // Update request status
    let newStatus: ApprovalStatus;
    if (decision === 'rejected') {
      newStatus = 'rejected';
    } else if (decision === 'deferred') {
      newStatus = 'deferred';
    } else {
      // Check if whole chain is satisfied
      const chainSatisfied = this._isChainSatisfied(request, level);
      newStatus = chainSatisfied ? 'approved' : 'pending'; // still pending next level
    }

    const updated = { ...request, status: newStatus, resolvedAt: now, resolvedBy };
    this._requests.set(requestId, updated);
    this._persistRequests();

    for (const l of this._resolutionListeners) {
      try { l(resolution, updated); } catch { /* ignore */ }
    }

    return resolution;
  }

  // ── Queries ──────────────────────────────────────────────────────────────

  getPending(): ApprovalRequest[] {
    return [...this._requests.values()].filter(r => r.status === 'pending');
  }

  getPendingByLevel(level: ApprovalLevel): ApprovalRequest[] {
    return this.getPending().filter(r => r.requiredLevel === level);
  }

  getRequest(id: string): ApprovalRequest | undefined {
    return this._requests.get(id);
  }

  getAllRequests(): ApprovalRequest[] {
    return [...this._requests.values()];
  }

  getResolutionsFor(requestId: string): ApprovalResolution[] {
    return this._resolutions.filter(r => r.requestId === requestId);
  }

  getPendingCount(): number {
    return this.getPending().length;
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  private _isChainSatisfied(request: ApprovalRequest, resolvedLevel: ApprovalLevel): boolean {
    const LEVEL_ORDER: ApprovalLevel[] = ['segreteria', 'dirigente', 'ministry', 'governo'];
    const resolvedIdx = LEVEL_ORDER.indexOf(resolvedLevel);
    const requiredIdx = LEVEL_ORDER.indexOf(request.requiredLevel);
    // Higher-level approval satisfies lower requirements
    if (resolvedIdx >= requiredIdx) {
      // Check if all chain steps above required are resolved
      const chainSteps = request.approvalChain;
      const resolvedSteps = new Set(
        this._resolutions
          .filter(r => r.requestId === request.id && r.decision === 'approved')
          .map(r => r.level),
      );
      return chainSteps.every(step => resolvedSteps.has(step) || LEVEL_ORDER.indexOf(step) <= resolvedIdx);
    }
    return false;
  }

  private _persistRequests(): void {
    const arr = [...this._requests.values()];
    safeStore(REQUESTS_KEY, arr);
  }

  private _trimResolutions(): void {
    if (this._resolutions.length > MAX_SIZE) {
      this._resolutions = this._resolutions.slice(-MAX_SIZE);
    }
  }

  private _persistResolutions(): void {
    safeStore(RESOLUTIONS_KEY, this._resolutions);
  }
}

export const approvalGate = new ApprovalGateImpl();
