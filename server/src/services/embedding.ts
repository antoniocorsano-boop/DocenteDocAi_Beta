/**
 * services/embedding.ts — Text Embedding Service (P31)
 *
 * Generates vector embeddings for semantic similarity search.
 *
 * Strategy:
 *   1. OpenAI text-embedding-3-small  (if OPENAI_API_KEY is set)
 *   2. Graceful degradation           (returns null — caller skips embedding)
 *
 * Security:
 *   - API key read from env only — never from request
 *   - Input truncated to 8192 tokens (~32 768 chars) before sending
 *   - No retries — caller treats embedding failure as non-fatal
 *
 * Notes:
 *   - P32 will swap JSONB storage for pgvector for O(log n) ANN search.
 *   - The embedding dimension for text-embedding-3-small is 1536.
 */

const OPENAI_EMBED_URL = 'https://api.openai.com/v1/embeddings';
const EMBED_MODEL      = 'text-embedding-3-small';
const MAX_INPUT_CHARS  = 8_000; // ~2k tokens — far within the 8192-token context

interface OpenAIEmbedResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage?: { prompt_tokens: number; total_tokens: number };
}

/**
 * Create a 1 536-dim embedding vector for the given text.
 *
 * Returns `null` when:
 *   - OPENAI_API_KEY is not set
 *   - The OpenAI API is unreachable or returns an error
 *
 * Callers must handle `null` gracefully (save without embedding, skip search).
 */
export async function createEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  // Truncate to avoid token-limit errors
  const input = text.slice(0, MAX_INPUT_CHARS).trim();
  if (!input) return null;

  try {
    const res = await fetch(OPENAI_EMBED_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ model: EMBED_MODEL, input }),
    });

    if (!res.ok) {
      // Non-fatal: log and return null so the caller continues without embedding
      const errText = await res.text().catch(() => '');
      console.warn(`[embedding] OpenAI error ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const json = await res.json() as OpenAIEmbedResponse;
    return json.data[0]?.embedding ?? null;
  } catch (err) {
    console.warn('[embedding] fetch failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ── Cosine similarity ─────────────────────────────────────────────────────────

/**
 * Compute the cosine similarity between two equal-length vectors.
 * Returns a value in [-1, 1] (higher = more similar).
 * Returns 0 if either vector is all-zeros or they have different lengths.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot  = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return dot / denom;
}
