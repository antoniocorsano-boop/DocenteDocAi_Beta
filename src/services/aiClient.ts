import { logger } from '../utils/logger';
import { consumeTokens, canUseTokens } from '../modules/system/TokenController';
import { isSimulation, localFallback } from '../modules/system/SimulationGuard';
import * as OfflineQueue from '../modules/system/OfflineQueue';

// P24: Register AI generate executor so queued requests are replayed on reconnect
OfflineQueue.register<{ model: string; contents: unknown; config?: unknown }>(
    'ai_generate',
    async (payload) => {
        const response = await fetch('/api/ai', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`AI replay failed: ${response.status}`);
    },
);

type GenAIModule = { GoogleGenAI?: new (opts: { apiKey: string }) => unknown; default?: unknown };
type GoogleAIClient = {
    apiKey?: string;
    models: { generateContent: (params: { model: string; contents: unknown; config?: unknown }) => Promise<{ text: string; candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }> }; groundingMetadata?: { groundingChunks?: Array<{ web?: { uri: string; title: string } }> } }> }> };
    live?: { connect: (params: unknown) => Promise<unknown> };
};

// ---------------------------------------------------------------------------
// Proxy client — used in production when VITE_GEMINI_API_KEY is not bundled.
// Calls /api/ai (Vercel serverless function) which holds the key server-side.
// ---------------------------------------------------------------------------
const createProxyClient = () => ({
    models: {
        generateContent: async (params: {
            model: string;
            contents: unknown;
            config?: unknown;
        }): Promise<{ text: string }> => {
            // P22: block AI calls during simulation
            if (isSimulation()) {
                const fb = localFallback(JSON.stringify(params.contents).slice(0, 100));
                return { text: fb.message };
            }

            const estimatedTokens = JSON.stringify(params.contents).length / 4;
            if (!canUseTokens(estimatedTokens)) {
                throw new Error('Token budget exceeded for this session');
            }

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: response.statusText }));
                // P24: network failure → enqueue for offline retry
                if (response.status === 0 || response.status >= 500) {
                    void OfflineQueue.enqueue('ai_generate', params);
                }
                throw Object.assign(new Error(err.error ?? 'AI proxy error'), { status: response.status });
            }
            const result = await response.json() as { text: string };
            // P22: record usage after successful call
            consumeTokens(estimatedTokens);
            return result;
        },
        /**
         * Streaming variant — yields SSE tokens from /api/ai.
         * Use for real-time Copilot chat responses.
         */
        streamGenerateContent: async function* (params: {
            model: string;
            contents: unknown;
            config?: unknown;
        }): AsyncGenerator<string, void, unknown> {
            // P22: block streaming during simulation
            if (isSimulation()) {
                const fb = localFallback(JSON.stringify(params.contents).slice(0, 100));
                yield fb.message;
                return;
            }

            const estimatedTokens = JSON.stringify(params.contents).length / 4;
            if (!canUseTokens(estimatedTokens)) {
                throw new Error('Token budget exceeded for this session');
            }

            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...params, streaming: true }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: response.statusText }));
                // P24: server errors → enqueue for offline retry
                if (response.status >= 500) {
                    void OfflineQueue.enqueue('ai_generate', { ...params, streaming: true });
                }
                throw Object.assign(new Error(err.error ?? 'AI proxy stream error'), { status: response.status });
            }
            if (!response.body) throw new Error('Streaming not supported');

            const reader  = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer    = '';
            let tokensYielded = 0;
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? '';
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: ')) continue;
                        const json = trimmed.slice(6);
                        if (json === '[DONE]') return;
                        try {
                            const data = JSON.parse(json) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
                            const token = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (token) { yield token; tokensYielded += token.length / 4; }
                        } catch { /* skip malformed line */ }
                    }
                }
            } finally {
                reader.releaseLock();
                // P24: record streamed token usage after stream ends
                if (tokensYielded > 0) consumeTokens(tokensYielded);
            }
        },
    },
});

// Lazy-load the Google GenAI SDK to avoid bundling it in the main chunk
let _cachedGenAiModule: GenAIModule | null = null;
export const getGoogleAIClient = async (): Promise<GoogleAIClient> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Production path: no key in bundle → use server-side proxy
    if (!apiKey) {
        return createProxyClient();
    }

    // Dev path: key available locally → use SDK directly
    if (!_cachedGenAiModule) {
        _cachedGenAiModule = await import('@google/genai');
    }
    const mod = _cachedGenAiModule as GenAIModule;
    const GoogleGenAI = mod?.GoogleGenAI || (mod?.default as (new (opts: { apiKey: string }) => GoogleAIClient) | undefined);
    return new (GoogleGenAI as new (opts: { apiKey: string }) => GoogleAIClient)({ apiKey });
};

/**
 * Esegue un'operazione AI con logica di Retry (Exponential Backoff), Timeout e limite tempo totale.
 */
export async function callAiWithRetry<T>(operation: () => Promise<T>, retries = 3, delay = 1000, timeoutMs = 30000, maxTotalTimeMs = 60000): Promise<T> {
    const startTime = Date.now();

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('La richiesta AI ha impiegato troppo tempo. Riprova più tardi.')), timeoutMs)
    );

    const operationWithTimeout = async (): Promise<T> => {
        return Promise.race([operation(), timeoutPromise]);
    };

    const attempt = async (remainingRetries: number, currentDelay: number): Promise<T> => {
        try {
            return await operationWithTimeout();
        } catch (error: unknown) {
            const elapsed = Date.now() - startTime;
            if (elapsed >= maxTotalTimeMs) {
                throw new Error('Tempo totale di retry superato. Riprova più tardi.');
            }

            let isRetryable = false;
            let userMessage = 'Si è verificato un errore imprevisto. Riprova.';
            const err = error as { status?: number; message?: string };

            if (err?.status === 429 || err?.message?.includes('quota')) {
                userMessage = 'Limite di utilizzo AI raggiunto. Riprova più tardi.';
                isRetryable = true;
            } else if (err?.status === 503 || err?.status === 500 || err?.message?.includes('overloaded')) {
                userMessage = 'Servizio AI temporaneamente non disponibile. Riprova.';
                isRetryable = true;
            } else if (err?.message?.includes('Richiesta AI scaduta') || err?.message?.includes('troppo tempo')) {
                userMessage = 'La richiesta AI ha impiegato troppo tempo. Riprova più tardi.';
                isRetryable = true;
            } else if (err?.message?.includes('API_KEY')) {
                userMessage = 'Configurazione AI non valida. Contatta il supporto.';
                isRetryable = false;
            }

        if (remainingRetries > 0 && isRetryable) {
            if (import.meta.env.DEV) {
                logger.warn(`AI API Warning: ${err.message}. Riprovo tra ${currentDelay}ms...`);
            }
            await new Promise(res => setTimeout(res, currentDelay));
            return attempt(remainingRetries - 1, currentDelay * 2);
        }

            throw new Error(userMessage);
        }
    };

    return attempt(retries, delay);
}

// In dev: check direct key. In production: proxy always available if deployed.
export const isAiConfigured = (): boolean =>
    !!import.meta.env.VITE_GEMINI_API_KEY || !import.meta.env.DEV;

