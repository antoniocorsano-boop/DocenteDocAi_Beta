/**
 * documentAI/ocrService.ts — OCR abstraction layer.
 *
 * Design:
 *   - Provider-agnostic: swap implementations without touching callers.
 *   - Pure async: no side effects, no store imports.
 *   - Edge-Function safe: no browser-only APIs.
 *
 * Supported providers (via OcrProvider interface):
 *   - GoogleVisionProvider  (uses GOOGLE_VISION_API_KEY env var)
 *   - AzureCVProvider       (uses AZURE_CV_KEY + AZURE_CV_ENDPOINT env vars)
 *   - FallbackTextProvider  (raw text pass-through — for plain-text inputs)
 *
 * Usage:
 *   const result = await extractText({ content: base64img, mimeType: 'image/jpeg' });
 */

import type { OcrResult } from './types';

// ─── Provider interface ───────────────────────────────────────────────────────

export interface OcrProvider {
  readonly name: string;
  /** Returns true if this provider is properly configured (env vars set). */
  isAvailable(): boolean;
  /**
   * Extract text from a base64-encoded image or PDF.
   * MUST NOT throw — return low-confidence result on failure.
   */
  extract(base64Content: string, mimeType: string): Promise<OcrResult>;
}

// ─── Google Cloud Vision provider ────────────────────────────────────────────

const GoogleVisionProvider: OcrProvider = {
  name: 'google-vision',

  isAvailable(): boolean {
    return Boolean(process.env.GOOGLE_VISION_API_KEY);
  },

  async extract(base64Content: string, _mimeType: string): Promise<OcrResult> {
    const apiKey = process.env.GOOGLE_VISION_API_KEY!;
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Content },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
          imageContext: { languageHints: ['it', 'en'] },
        }],
      }),
    });

    if (!response.ok) {
      return { rawText: '', confidence: 0, extractedAt: new Date().toISOString() };
    }

    const json = await response.json() as {
      responses?: Array<{
        fullTextAnnotation?: { text?: string };
        error?: { message: string };
      }>;
    };

    const annotation = json.responses?.[0]?.fullTextAnnotation;
    if (!annotation?.text) {
      return { rawText: '', confidence: 0.1, extractedAt: new Date().toISOString() };
    }

    // Vision API doesn't return a unified confidence score — use 0.9 as default
    return {
      rawText: annotation.text.trim(),
      confidence: 0.9,
      extractedAt: new Date().toISOString(),
    };
  },
};

// ─── Azure Computer Vision provider ──────────────────────────────────────────

const AzureCVProvider: OcrProvider = {
  name: 'azure-computer-vision',

  isAvailable(): boolean {
    return Boolean(process.env.AZURE_CV_KEY && process.env.AZURE_CV_ENDPOINT);
  },

  async extract(base64Content: string, _mimeType: string): Promise<OcrResult> {
    const key = process.env.AZURE_CV_KEY!;
    const endpoint = process.env.AZURE_CV_ENDPOINT!;

    // Azure Read API — submit
    const submitUrl = `${endpoint}/computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=read`;
    const imageBytes = Uint8Array.from(atob(base64Content), (c) => c.charCodeAt(0));

    const submitRes = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/octet-stream' },
      body: imageBytes,
    });

    if (!submitRes.ok) {
      return { rawText: '', confidence: 0, extractedAt: new Date().toISOString() };
    }

    const result = await submitRes.json() as {
      readResult?: { content?: string };
    };

    return {
      rawText: result.readResult?.content?.trim() ?? '',
      confidence: 0.88,
      extractedAt: new Date().toISOString(),
    };
  },
};

// ─── Fallback: plain-text pass-through (for already-decoded text) ─────────────

const FallbackTextProvider: OcrProvider = {
  name: 'fallback-text',
  isAvailable: () => true,
  async extract(content: string): Promise<OcrResult> {
    return {
      rawText: content,
      confidence: 1.0,
      extractedAt: new Date().toISOString(),
    };
  },
};

// ─── Provider registry ────────────────────────────────────────────────────────

const PROVIDERS: OcrProvider[] = [
  GoogleVisionProvider,
  AzureCVProvider,
  FallbackTextProvider, // always last — guaranteed available
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract text from a base64-encoded image.
 *
 * Provider selection: first available provider wins.
 * Falls back gracefully — never throws.
 */
export async function extractText(
  base64Content: string,
  mimeType: string,
): Promise<OcrResult> {
  const provider = PROVIDERS.find((p) => p.isAvailable()) ?? FallbackTextProvider;
  try {
    return await provider.extract(base64Content, mimeType);
  } catch (err) {
    console.error(`[ocrService] provider "${provider.name}" failed:`, err);
    return { rawText: '', confidence: 0, extractedAt: new Date().toISOString() };
  }
}
