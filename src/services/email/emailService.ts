/**
 * email/emailService.ts — Email sending interface and implementation.
 *
 * Design:
 *   - Provider-agnostic: swap SMTP/API providers without touching callers.
 *   - Integrates with the existing gmailService for Google-authenticated users.
 *   - Supports attachments (for signed documents).
 *   - Edge-Function safe.
 *
 * Usage:
 *   import { sendEmail } from '@/services/email/emailService';
 *   await sendEmail({ to, subject, body });
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailAttachment {
  /**
   * Base64-encoded file content.
   * Using string ensures Edge-Function compatibility (no File/Blob API required).
   */
  content: string;
  filename: string;
  mimeType: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  /** Optional CC recipients */
  cc?: string[];
  attachments?: EmailAttachment[];
}

export interface EmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

// ─── Provider interface ───────────────────────────────────────────────────────

/**
 * Implement this interface to add a new email provider.
 * Register it in PROVIDERS below — first available wins.
 */
export interface EmailProvider {
  readonly name: string;
  /** True if this provider can be used (env vars / auth available). */
  isAvailable(): boolean;
  send(message: EmailMessage): Promise<EmailResult>;
}

// ─── Gmail provider (reuses existing gmailService) ───────────────────────────

/**
 * Gmail API provider — available in the browser when the teacher is signed in.
 * Delegates to the existing `sendEmail` from gmailService (already in codebase).
 * Not available in Edge Functions (requires gapi/OAuth).
 */
const GmailProvider: EmailProvider = {
  name: 'gmail',

  isAvailable(): boolean {
    // gapi is only available in browser context
    return typeof window !== 'undefined' && typeof (window as unknown as { gapi?: unknown }).gapi !== 'undefined';
  },

  async send(message: EmailMessage): Promise<EmailResult> {
    // Lazy import to avoid SSR/Edge issues
    const { sendEmail: sendGmailEmail } = await import('../gmailService');
    try {
      await sendGmailEmail(message.to, message.subject, message.body);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Gmail error' };
    }
  },
};

// ─── External SMTP provider (Resend / SendGrid / SMTP2GO) ────────────────────

/**
 * Server-side email via external API.
 * Provider is selected by EMAIL_PROVIDER env var.
 * Supported: 'resend' (RESEND_API_KEY), 'sendgrid' (SENDGRID_API_KEY).
 */
const ExternalApiProvider: EmailProvider = {
  name: 'external-api',

  isAvailable(): boolean {
    return Boolean(process.env.RESEND_API_KEY ?? process.env.SENDGRID_API_KEY);
  },

  async send(message: EmailMessage): Promise<EmailResult> {
    if (process.env.RESEND_API_KEY) {
      return sendViaResend(message);
    }
    if (process.env.SENDGRID_API_KEY) {
      return sendViaSendGrid(message);
    }
    return { ok: false, error: 'No external email provider configured' };
  },
};

async function sendViaResend(message: EmailMessage): Promise<EmailResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'noreply@docentedoc.ai',
      to: [message.to],
      cc: message.cc,
      subject: message.subject,
      text: message.body,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    }),
  });
  if (!res.ok) return { ok: false, error: `Resend error: ${res.status}` };
  const data = await res.json() as { id?: string };
  return { ok: true, messageId: data.id };
}

async function sendViaSendGrid(message: EmailMessage): Promise<EmailResult> {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: message.to }],
        cc: message.cc?.map((e) => ({ email: e })),
      }],
      from: { email: process.env.EMAIL_FROM ?? 'noreply@docentedoc.ai' },
      subject: message.subject,
      content: [{ type: 'text/plain', value: message.body }],
    }),
  });
  if (!res.ok) return { ok: false, error: `SendGrid error: ${res.status}` };
  return { ok: true };
}

// ─── Provider registry ────────────────────────────────────────────────────────

const PROVIDERS: EmailProvider[] = [
  GmailProvider,
  ExternalApiProvider,
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send an email via the first available provider.
 * Never throws — returns an EmailResult with ok=false on failure.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const provider = PROVIDERS.find((p) => p.isAvailable());
  if (!provider) {
    return {
      ok: false,
      error: 'Nessun provider email configurato. Configura Gmail o aggiungi RESEND_API_KEY.',
    };
  }
  try {
    return await provider.send(message);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown email error' };
  }
}
