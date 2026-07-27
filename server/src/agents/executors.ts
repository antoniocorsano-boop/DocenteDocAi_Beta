/**
 * agents/executors.ts — server-side agent execution logic (P30)
 *
 * Each executor receives the raw input and the agent's `config` JSONB.
 * Executors run inside the /agents/:id/run route after auth + budget checks.
 *
 * Types supported: compliance | monitoring | cognitive | custom
 */

export type ServerAgentExecutor = (
  input: unknown,
  config: Record<string, unknown>,
) => Promise<unknown>;

// ── Compliance ────────────────────────────────────────────────────────────────

const compliance: ServerAgentExecutor = async (input, _config) => {
  const text = typeof input === 'string' ? input : JSON.stringify(input);
  // Basic PII patterns — expand as needed
  const PII_RE =
    /\b[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]\b|   (?:\d{1,3}\.){3}\d{1,3}|\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi;

  const redacted = text.replace(PII_RE, '***');
  return {
    ok:            true,
    inputLength:   text.length,
    cleanedLength: redacted.length,
    redacted:      redacted !== text,
    output:        redacted,
  };
};

// ── Monitoring ────────────────────────────────────────────────────────────────

const monitoring: ServerAgentExecutor = async (_input, _config) => {
  return {
    ok:        true,
    uptime:    process.uptime(),
    memoryMb:  Math.round(process.memoryUsage().rss / 1_048_576),
    timestamp: Date.now(),
    healthy:   true,
  };
};

// ── Cognitive stub ────────────────────────────────────────────────────────────

const cognitive: ServerAgentExecutor = async (input, config) => {
  const text = typeof input === 'string' ? input : JSON.stringify(input);
  return {
    ok:     true,
    status: 'stub',
    model:  (config['model'] as string | undefined) ?? 'gemini-2.0-flash',
    preview: text.slice(0, 100),
    note:   'Server-side cognitive analysis: implementazione pianificata in P31 (RAG)',
  };
};

// ── Custom fallback ───────────────────────────────────────────────────────────

const custom: ServerAgentExecutor = async (input, config) => {
  return {
    ok:     true,
    status: 'custom',
    config,
    echo:   typeof input === 'string' ? input.slice(0, 200) : null,
  };
};

// ── Registry ──────────────────────────────────────────────────────────────────

export const executors: Record<string, ServerAgentExecutor> = {
  compliance,
  monitoring,
  cognitive,
  custom,
};

/** Returns the executor for the given agent type, falling back to `custom`. */
export function getExecutor(type: string): ServerAgentExecutor {
  return executors[type] ?? executors['custom']!;
}
