/**
 * services/agentApiClient.ts — HTTP client for the P30 Agent Platform API (P31)
 *
 * Thin fetch wrappers around:
 *   GET    /agents            — list active agents
 *   POST   /agents            — create agent
 *   PATCH  /agents/:id        — update agent
 *   POST   /agents/:id/run    — execute agent server-side
 *   POST   /memory            — save memory entry
 *   GET    /memory            — retrieve memory history
 *   POST   /memory/search     — semantic similarity search (P31)
 *
 * All requests include `credentials: 'include'` so the session cookie is sent.
 * Network errors are returned as `{ error: string }` objects — never thrown.
 */

const BASE = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServerAgent {
  id:               string;
  user_id:          string;
  name:             string;
  type:             'compliance' | 'cognitive' | 'monitoring' | 'custom';
  config:           Record<string, unknown>;
  estimated_tokens: number;
  is_active:        boolean;
  created_at:       string;
  updated_at:       string;
}

export interface ServerRunResult {
  success:    boolean;
  data?:      unknown;
  error?:     string | null;
  tokensUsed: number;
  durationMs: number;
  simulated:  boolean;
  blocked_by: string | null;
  run_id:     string;
}

export interface MemoryEntry {
  id:         string;
  user_id:    string;
  content:    string;
  metadata:   Record<string, unknown>;
  created_at: string;
}

export interface CreateAgentPayload {
  name:             string;
  type:             'compliance' | 'cognitive' | 'monitoring' | 'custom';
  config?:          Record<string, unknown>;
  estimated_tokens?: number;
}

/** Result item returned by the /memory/search endpoint (P32-C). */
export interface MemorySearchResult {
  content:         string;
  /** Composite score (cosine × 0.70 + temporal × 0.20 + tagBoost × 0.10) */
  score:           number;
  /** Raw cosine similarity component — useful for explainability UI (P33) */
  cosine_score?:   number;
  /** Temporal decay component — 1.0 = fresh, ~0.5 = 30 days old */
  temporal_score?: number;
  /** Jaccard tag-overlap component */
  tag_score?:      number;
  /** Keyword tags stored with this memory entry */
  tags?:           string[];
}

// ─── Agents ───────────────────────────────────────────────────────────────────

/** Fetch list of active agents from the server registry. */
export async function fetchAgents(): Promise<ServerAgent[]> {
  if (!BASE) return [];
  try {
    const res = await fetch(`${BASE}/agents`, { credentials: 'include' });
    if (!res.ok) return [];
    const json = await res.json() as { agents: ServerAgent[] };
    return json.agents ?? [];
  } catch {
    return [];
  }
}

/** Create a new agent in the server registry. */
export async function createAgent(payload: CreateAgentPayload): Promise<{ id: string } | { error: string }> {
  if (!BASE) return { error: 'VITE_BACKEND_URL non configurato' };
  const res = await fetch(`${BASE}/agents`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(payload),
  });
  return res.json() as Promise<{ id: string } | { error: string }>;
}

/** Update an agent's config or active state. */
export async function updateAgent(
  id: string,
  patch: Partial<Pick<ServerAgent, 'name' | 'config' | 'estimated_tokens' | 'is_active'>>,
): Promise<{ ok: true } | { error: string }> {
  if (!BASE) return { error: 'VITE_BACKEND_URL non configurato' };
  const res = await fetch(`${BASE}/agents/${encodeURIComponent(id)}`, {
    method:      'PATCH',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify(patch),
  });
  return res.json() as Promise<{ ok: true } | { error: string }>;
}

// ─── Agent execution ──────────────────────────────────────────────────────────

/**
 * Execute an agent on the server.
 * Returns a `ServerRunResult` on success or a synthetic error result on failure.
 */
export async function runAgentOnServer(
  id: string,
  input: unknown,
): Promise<ServerRunResult> {
  const errorResult = (msg: string): ServerRunResult => ({
    success:    false,
    error:      msg,
    tokensUsed: 0,
    durationMs: 0,
    simulated:  false,
    blocked_by: null,
    run_id:     '',
  });

  if (!BASE) return errorResult('VITE_BACKEND_URL non configurato');

  try {
    const res = await fetch(`${BASE}/agents/${encodeURIComponent(id)}/run`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ input }),
    });

    if (res.status === 401) return errorResult('Non autenticato');
    if (res.status === 404) return errorResult(`Agente "${id}" non trovato sul server`);
    if (res.status === 402) return errorResult('Budget token esaurito');
    if (res.status === 429) return errorResult('Troppe richieste — riprova tra un minuto');

    return res.json() as Promise<ServerRunResult>;
  } catch (err) {
    return errorResult(err instanceof Error ? err.message : 'Errore di rete');
  }
}

// ─── Memory ───────────────────────────────────────────────────────────────────

/** Persist a memory entry for the current user. */
export async function saveMemory(
  content: string,
  metadata?: Record<string, unknown>,
): Promise<{ id: string } | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}/memory`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ content, metadata }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ id: string }>;
  } catch {
    return null;
  }
}

/** Retrieve recent memory entries for the current user. */
export async function fetchMemory(limit = 20): Promise<MemoryEntry[]> {
  if (!BASE) return [];
  try {
    const url = `${BASE}/memory?limit=${Math.min(Math.max(limit, 1), 100)}`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return [];
    const json = await res.json() as { entries: MemoryEntry[] };
    return json.entries ?? [];
  } catch {
    return [];
  }
}

/**
 * Semantic similarity search over the current user's memory entries (P31).
 * Returns up to 5 results sorted by relevance score (0–1).
 * Returns an empty array when no backend is configured or on any error.
 */
export async function searchMemory(query: string, limit = 5): Promise<MemorySearchResult[]> {
  if (!BASE) return [];
  try {
    const res = await fetch(`${BASE}/memory/search`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ query, limit }),
    });
    if (!res.ok) return [];
    return res.json() as Promise<MemorySearchResult[]>;
  } catch {
    return [];
  }
}

// ─── Adaptive Intelligence (P34) ─────────────────────────────────────────────

/** Agent scoring record returned by GET /adaptive/scores */
export interface AgentScore {
  agentId:     string;
  /** Composite score [0, 1] */
  score:       number;
  /** Success-rate-based reliability [0, 1] */
  reliability: number;
  totalRuns:   number;
  updatedAt:   string;
}

export interface LogOutcomePayload {
  agentId:      string;
  input?:       unknown;
  output?:      unknown;
  success:      boolean;
  tokensUsed:   number;
  cosineScore?: number | null;
}

export interface MemorySummaryResult {
  id:         string;
  userId:     string;
  summary:    string;
  entryCount: number;
  createdAt:  string;
}

/**
 * Fetch all agent scores from the adaptive layer.
 * Returns [] when backend is unavailable or unauthenticated.
 */
export async function fetchAgentScores(): Promise<AgentScore[]> {
  if (!BASE) return [];
  try {
    const res = await fetch(`${BASE}/adaptive/scores`, { credentials: 'include' });
    if (!res.ok) return [];
    const json = await res.json() as { scores: AgentScore[] };
    return json.scores ?? [];
  } catch {
    return [];
  }
}

/**
 * Log one agent execution outcome to the adaptive layer.
 * Fire-and-forget — never throws, returns silently on error.
 */
export async function logAgentOutcomeToServer(payload: LogOutcomePayload): Promise<void> {
  if (!BASE) return;
  try {
    await fetch(`${BASE}/adaptive/outcomes`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(payload),
    });
  } catch {
    // non-fatal: ignore network errors
  }
}

/**
 * Trigger server-side score recalculation for one agent.
 * Non-fatal — useful after batching many outcomes.
 */
export async function triggerScoreUpdate(agentId: string): Promise<void> {
  if (!BASE) return;
  try {
    await fetch(`${BASE}/adaptive/scores/update`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ agentId }),
    });
  } catch {
    // non-fatal
  }
}

/**
 * Compress old memory entries for the current user.
 * Returns the list of summaries created, or [] on any error.
 */
export async function compressUserMemory(batchSize = 50): Promise<MemorySummaryResult[]> {
  if (!BASE) return [];
  try {
    const res = await fetch(`${BASE}/adaptive/memory/compress`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ batchSize }),
    });
    if (!res.ok) return [];
    const json = await res.json() as { summaries: MemorySummaryResult[] };
    return json.summaries ?? [];
  } catch {
    return [];
  }
}

// ─── Continuous Feedback Loop (P35) ──────────────────────────────────────────

/** User feedback payload sent to POST /feedback. */
export interface FeedbackPayload {
  outcomeId?: number;
  agentId?:   string;
  rating:     number;   // 1-5
  notes?:     string;
  tags?:      string[];
}

/** Per-agent summary item returned by GET /adaptive/summary. */
export interface AdaptiveSummaryItem {
  agentId:     string;
  avgScore:    number;
  totalRuns:   number;
  avgRating:   number | null;
  lastUpdated: string;
}

/** Payload for POST /adaptive/update (beta users only). */
export interface ApplyUpdatePayload {
  agentId:      string;
  newParams:    Record<string, unknown>;
  triggerType?: 'auto' | 'manual';
  learningRate?: number;
}

/** Runtime param record returned by GET /adaptive/params. */
export interface AgentParamsEntry {
  agentId:   string;
  params:    Record<string, unknown>;
  version:   number;
  updatedAt: string;
}

/**
 * Submit one user feedback item to the server.
 * Fire-and-forget — never throws.
 */
export async function submitUserFeedback(payload: FeedbackPayload): Promise<void> {
  if (!BASE) return;
  try {
    await fetch(`${BASE}/feedback`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(payload),
    });
  } catch {
    // non-fatal
  }
}

/**
 * Fetch per-agent adaptive metrics from GET /adaptive/summary.
 * Returns [] when backend is unavailable.
 */
export async function fetchAdaptiveSummary(): Promise<AdaptiveSummaryItem[]> {
  if (!BASE) return [];
  try {
    const res = await fetch(`${BASE}/adaptive/summary`, { credentials: 'include' });
    if (!res.ok) return [];
    const json = await res.json() as { summary: AdaptiveSummaryItem[] };
    return json.summary ?? [];
  } catch {
    return [];
  }
}

/**
 * Apply a parameter update for a given agent (beta users only).
 * Returns { updateId, rolledBack } on success, null on error or 403/429.
 */
export async function applyAdaptiveParams(
  payload: ApplyUpdatePayload,
): Promise<{ updateId: number; rolledBack: boolean } | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}/adaptive/update`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json() as { updateId: number; rolledBack: boolean };
  } catch {
    return null;
  }
}

/**
 * Roll back a previously applied adaptive update by ID.
 * Returns true when the rollback succeeded.
 */
export async function rollbackAdaptiveParams(updateId: number): Promise<boolean> {
  if (!BASE) return false;
  try {
    const res = await fetch(`${BASE}/adaptive/rollback`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ updateId }),
    });
    if (!res.ok) return false;
    const json = await res.json() as { rolledBack: boolean };
    return json.rolledBack ?? false;
  } catch {
    return false;
  }
}

/**
 * Fetch all (or one) agent runtime parameter records.
 * Returns [] when backend is unavailable.
 */
export async function fetchAgentParams(agentId?: string): Promise<AgentParamsEntry[]> {
  if (!BASE) return [];
  try {
    const url = agentId
      ? `${BASE}/adaptive/params?agentId=${encodeURIComponent(agentId)}`
      : `${BASE}/adaptive/params`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return [];
    const json = await res.json() as { params: AgentParamsEntry[] };
    return json.params ?? [];
  } catch {
    return [];
  }
}
