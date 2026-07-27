/**
 * StreamingManager.ts — Client-side streaming bridge for the AI proxy.
 *
 * When the browser calls `/api/ai` with `{ streaming: true }`, the server
 * responds with `Content-Type: text/event-stream` (SSE). This module:
 *   1. Sends the request to `/api/ai`
 *   2. Reads the SSE response as a `ReadableStream`
 *   3. Yields each decoded text token via an `AsyncGenerator<string>`
 *
 * Usage:
 *   const gen = StreamingManager.stream({ pipelineId: 'copilot.chat', prompt });
 *   for await (const token of gen) {
 *     setResponse(prev => prev + token);
 *   }
 */

import { PipelineRegistry } from './PipelineRegistry';
import { resolveModel } from './ModelRouter';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StreamRequest {
    /** Registered pipeline ID — determines model tier and system prompt. */
    pipelineId: string;
    /** User prompt text */
    prompt: string;
    /** Optional chat history for multi-turn conversations */
    history?: Array<{ role: 'user' | 'model'; text: string }>;
    /** Override temperature (0–2). Default: 0.7 */
    temperature?: number;
    /** Override max output tokens. Default: 2048 */
    maxTokens?: number;
}

export interface StreamChunk {
    token: string;
    done: boolean;
}

// ── SSE line parser ───────────────────────────────────────────────────────────

function extractTokenFromSSELine(line: string): string | null {
    if (!line.startsWith('data: ')) return null;
    const jsonStr = line.slice(6).trim();
    if (jsonStr === '[DONE]') return null;
    try {
        const data = JSON.parse(jsonStr) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch {
        return null;
    }
}

// ── Core streaming function ───────────────────────────────────────────────────

/**
 * Streams tokens from the AI proxy for the given request.
 *
 * @yields  string — one token at a time as they arrive from the server.
 * @throws  Error  — on network failure or non-2xx response.
 */
export async function* streamAI(req: StreamRequest): AsyncGenerator<string, void, unknown> {
    const pipeline = PipelineRegistry.get(req.pipelineId);
    const model = resolveModel(pipeline.tier);

    // Build Gemini contents array (system turn + optional history + user prompt)
    type GeminiPart = { text: string };
    type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

    const contents: GeminiContent[] = [
        ...(req.history ?? []).map(h => ({
            role: h.role,
            parts: [{ text: h.text }],
        })),
        { role: 'user', parts: [{ text: req.prompt }] },
    ];

    const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            streaming: true,
            model,
            contents,
            config: {
                systemInstruction: pipeline.systemPrompt,
                generationConfig: {
                    temperature: req.temperature ?? 0.7,
                    maxOutputTokens: req.maxTokens ?? 2048,
                },
            },
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: response.statusText }));
        throw Object.assign(
            new Error((err as { error?: string }).error ?? 'AI streaming error'),
            { status: response.status },
        );
    }

    if (!response.body) {
        throw new Error('Streaming not supported by this environment');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE lines
            const lines = buffer.split('\n');
            // Keep last (potentially incomplete) line in buffer
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                const token = extractTokenFromSSELine(trimmed);
                if (token !== null) yield token;
            }
        }

        // Flush remaining buffer
        if (buffer.trim()) {
            const token = extractTokenFromSSELine(buffer.trim());
            if (token !== null) yield token;
        }
    } finally {
        reader.releaseLock();
    }
}

// ── Higher-level helper: collect full response ─────────────────────────────

/**
 * Convenience wrapper that collects all streaming tokens into a single string.
 * Use `streamAI` directly for real-time token-by-token updates.
 */
export async function streamAIToString(req: StreamRequest): Promise<string> {
    const parts: string[] = [];
    for await (const token of streamAI(req)) {
        parts.push(token);
    }
    return parts.join('');
}
