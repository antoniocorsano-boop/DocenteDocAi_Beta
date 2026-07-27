/**
 * modules/system/StorageCrypto.ts  —  P23 + P24 Production Hardening
 *
 * AES-GCM symmetric encryption for sensitive localStorage values.
 *
 * P23: ephemeral session key (single-tab isolation)
 * P24: upgraded to use KeyVault — when a user identity is available the key is
 *      PBKDF2-derived and survives page reloads. Falls back to ephemeral when
 *      the user is anonymous (pilot / dev).
 *
 * Usage:
 *   const cipher = await encrypt(JSON.stringify(sensitiveObject));
 *   localStorage.setItem(KEY, cipher);
 *
 *   const plain = await decrypt(localStorage.getItem(KEY) ?? '');
 *   const data = JSON.parse(plain);
 */

import { getActiveKey } from './KeyVault';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromb64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const buf = new ArrayBuffer(bin.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Encrypts a plain-text string with AES-GCM-256.
 * Returns a base64-encoded string: "<iv_b64>.<ciphertext_b64>".
 * If WebCrypto is unavailable, returns the original string unchanged.
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getActiveKey();
  if (!key) return plaintext; // graceful degradation

  const iv  = crypto.getRandomValues(new Uint8Array(12) as Uint8Array<ArrayBuffer>);
  const buf = new TextEncoder().encode(plaintext);
  const ct  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buf);
  return `${b64(iv.buffer)}|${b64(ct)}`;
}

/**
 * Decrypts a string produced by `encrypt()`.
 * If decryption fails (wrong key, plain-text legacy value), returns the input
 * string as-is so legacy plain-text entries still parse correctly.
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getActiveKey();
  if (!key || !ciphertext.includes('|')) return ciphertext;

  try {
    const [ivB64, ctB64] = ciphertext.split('|');
    const iv       = fromb64(ivB64 ?? '');
    const ct       = fromb64(ctB64 ?? '');
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(decrypted);
  } catch {
    // Legacy entry or wrong key — return as-is
    return ciphertext;
  }
}
