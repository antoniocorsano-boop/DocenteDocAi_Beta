/**
 * signature/signatureService.ts — Digital signature interface.
 *
 * IMPORTANT: This module defines the interface and flow ONLY.
 * NO fake or stub signature logic is implemented.
 * Real signature requires an external provider (Namirial, Docusign, etc.).
 *
 * When requiresSignature is true in an email flow:
 *   1. Collect document as base64
 *   2. Call signatureService.sign(document)
 *   3. Attach the signed document
 *   4. Send email via emailService
 *
 * Usage:
 *   import { signatureService, isSignatureAvailable } from '@/services/signature/signatureService';
 *   if (isSignatureAvailable()) {
 *     const signed = await signatureService.sign(doc);
 *   }
 */

import type { EmailAttachment } from '../email/emailService';

// ─── Provider interface ───────────────────────────────────────────────────────

/**
 * Implement this interface and register a provider to enable digital signatures.
 *
 * Available providers (not bundled — require separate server-side integration):
 *   - NamirialProvider  → NAMIRIAL_API_KEY  (Italian qualified signature, EU eIDAS compliant)
 *   - DocuSignProvider  → DOCUSIGN_API_KEY
 *   - AdobeSignProvider → ADOBE_SIGN_API_KEY
 */
export interface SignatureProvider {
  readonly name: string;
  /** True if the provider is configured and ready to sign. */
  isAvailable(): boolean;
  /**
   * Sign the given document.
   *
   * @param document - Base64-encoded document to sign + its filename/mimeType
   * @returns The signed document as an EmailAttachment (base64 content)
   *
   * MUST NOT return the original document unchanged — callers assume the result is signed.
   * MUST throw or return a rejected promise on failure (caller handles errors).
   */
  sign(document: EmailAttachment): Promise<EmailAttachment>;
}

// ─── Signature result ─────────────────────────────────────────────────────────

export interface SignatureResult {
  ok: boolean;
  signedDocument?: EmailAttachment;
  error?: string;
  /** Provider that signed the document */
  provider?: string;
}

// ─── No-op placeholder (never signs — forces external provider setup) ─────────

const NoOpProvider: SignatureProvider = {
  name: 'none',
  isAvailable: () => false,
  async sign(): Promise<EmailAttachment> {
    throw new Error(
      'Digital signature requires an external provider. ' +
      'Set NAMIRIAL_API_KEY, DOCUSIGN_API_KEY, or ADOBE_SIGN_API_KEY.',
    );
  },
};

// ─── Provider registry ────────────────────────────────────────────────────────

let _activeProvider: SignatureProvider = NoOpProvider;

/**
 * Register a concrete signature provider.
 * Call this once during app initialisation.
 *
 * @example
 * import { registerSignatureProvider } from '@/services/signature/signatureService';
 * import { NamirialProvider } from './providers/NamirialProvider';
 * registerSignatureProvider(NamirialProvider);
 */
export function registerSignatureProvider(provider: SignatureProvider): void {
  _activeProvider = provider;
}

/** True when a real signature provider is configured and available. */
export function isSignatureAvailable(): boolean {
  return _activeProvider.isAvailable();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Attempt to sign the given document.
 *
 * Returns a SignatureResult — never throws.
 * If no provider is configured, returns ok=false with a clear error message.
 */
export async function signDocument(document: EmailAttachment): Promise<SignatureResult> {
  if (!_activeProvider.isAvailable()) {
    return {
      ok: false,
      error:
        'Firma digitale non configurata. ' +
        'Contatta l\'amministratore per abilitare il provider di firma.',
    };
  }

  try {
    const signed = await _activeProvider.sign(document);
    return { ok: true, signedDocument: signed, provider: _activeProvider.name };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Errore firma sconosciuto',
    };
  }
}

/**
 * Full email + optional signature flow.
 *
 * IF requiresSignature AND a provider is available:
 *   1. sign(document)
 *   2. attach signed document
 *   3. send email
 *
 * IF no signature provider is available:
 *   sends email without signature and includes a warning in the result.
 */
export async function signAndAttach(
  document: EmailAttachment,
): Promise<{ attachment: EmailAttachment; warning?: string }> {
  const result = await signDocument(document);

  if (result.ok && result.signedDocument) {
    return { attachment: result.signedDocument };
  }

  // Degrade gracefully: return original document with warning
  return {
    attachment: document,
    warning: result.error ?? 'Firma non applicata — documento allegato senza firma.',
  };
}
