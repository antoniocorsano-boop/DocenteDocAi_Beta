/**
 * modules/system/KeyVault.ts  —  P24 Enterprise Readiness
 *
 * Deterministic AES-GCM key derivation for persistent encrypted storage.
 *
 * Design
 * ──────
 *  • When a user identity is available (userId + email from Google Sign-In),
 *    the key is derived with PBKDF2 from their identity + an app salt.
 *    Result: same user → same key across reloads → encrypted data survives.
 *
 *  • When no user identity is available (anonymous / dev), falls back to the
 *    P23 ephemeral key (re-generated each page load).
 *
 * Security properties
 * ───────────────────
 *  • 600 000 PBKDF2-SHA-256 iterations (OWASP 2025 recommendation for AES-256)
 *  • Non-extractable CryptoKey — never leaves JS memory as raw bytes
 *  • App salt (32 random bytes, stored in localStorage un-encrypted) is per-install,
 *    so even if two users share a device they get different derived keys
 *  • Falling back to ephemeral is always safe — data simply cannot be decrypted
 *    after a reload when anonymous, which is the correct behaviour for PA data
 *
 * Usage
 * ─────
 *  // On user login:
 *  await KeyVault.init({ id: 'usr_abc', email: 'prof@istituto.edu' });
 *
 *  // On logout:
 *  KeyVault.clear();
 *
 *  // StorageCrypto calls this automatically — no manual usage needed elsewhere.
 */

const APP_SALT_KEY = 'orbit_app_salt_v1';
const PBKDF2_ITERATIONS = 600_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromb64(s: string): ArrayBuffer {
  const bin = atob(s);
  const buf = new ArrayBuffer(bin.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return buf;
}

/** Get or create the per-install random application salt (stored unencrypted). */
function getAppSalt(): ArrayBuffer {
  try {
    const stored = localStorage.getItem(APP_SALT_KEY);
    if (stored) return fromb64(stored);
    const salt = crypto.getRandomValues(new Uint8Array(32) as Uint8Array<ArrayBuffer>).buffer;
    localStorage.setItem(APP_SALT_KEY, b64(salt));
    return salt;
  } catch {
    // Non-persistent fallback (SSR / Node)
    return crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer;
  }
}

// ─── State ───────────────────────────────────────────────────────────────────

let _derivedKey: CryptoKey | null = null;
let _ephemeralKey: CryptoKey | null = null;

/** Identity used for the current derived key — used to detect stale keys. */
let _activeIdentity: string | null = null;

// ─── Public API ──────────────────────────────────────────────────────────────

export interface UserIdentity {
  id: string;
  email?: string;
}

/**
 * Initialise the KeyVault with a user identity.
 * Must be called after a successful sign-in.
 * Subsequent calls with the same identity are no-ops.
 */
export async function initKeyVault(user: UserIdentity): Promise<void> {
  if (typeof crypto?.subtle === 'undefined') return;

  const identityString = `${user.id}:${user.email ?? ''}`;
  if (_derivedKey && _activeIdentity === identityString) return; // already initialised

  try {
    const salt        = getAppSalt();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(identityString),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'],
    );

    _derivedKey = await crypto.subtle.deriveKey(
      {
        name:       'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash:       'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );

    _activeIdentity = identityString;
  } catch {
    // Derivation failed — keep whatever key exists
  }
}

/**
 * Clear the derived key on logout.
 * After this, StorageCrypto will fall back to the ephemeral key.
 */
export function clearKeyVault(): void {
  _derivedKey     = null;
  _activeIdentity = null;
}

/**
 * Return the best available CryptoKey:
 *  1. Derived (persistent across reloads for the same user)
 *  2. Ephemeral (session-only, generated if not yet available)
 *
 * Called by StorageCrypto — not intended for direct use elsewhere.
 */
export async function getActiveKey(): Promise<CryptoKey | null> {
  if (_derivedKey) return _derivedKey;
  if (typeof crypto?.subtle === 'undefined') return null;

  // Return / lazily create the ephemeral fallback
  if (!_ephemeralKey) {
    try {
      _ephemeralKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      );
    } catch {
      return null;
    }
  }
  return _ephemeralKey;
}

/** Whether a persistent (user-derived) key is active. */
export function hasPersistentKey(): boolean {
  return _derivedKey !== null;
}
