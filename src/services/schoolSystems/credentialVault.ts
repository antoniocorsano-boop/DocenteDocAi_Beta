/**
 * schoolSystems/credentialVault.ts — Encrypted credential storage.
 *
 * Uses the browser Web Crypto API (AES-GCM 256-bit) to encrypt API tokens
 * and keys before persisting them in localStorage. The vault key is stored in
 * sessionStorage — it is tab-scoped and lost on browser close, requiring the
 * user to re-enter credentials on the next session.
 *
 * SECURITY model:
 *   ✅ Protects against localStorage theft (encrypted ciphertext only on disk)
 *   ✅ Passwords are NEVER stored — only tokens/API keys after successful auth
 *   ✅ Key is session-scoped (sessionStorage) — not accessible across sessions
 *   ⚠️  Not resistant to same-tab XSS attacks — this is the browser's inherent limit
 *
 * Stored keys:
 *   localStorage:  `school_vault_${providerId}` → base64-encoded ciphertext
 *   sessionStorage: `school_vault_key`          → base64-encoded AES key
 */

const VAULT_KEY_STORAGE = 'school_vault_key';
const VAULT_PREFIX      = 'school_vault_';

// ─── Key management ───────────────────────────────────────────────────────────

async function getOrCreateVaultKey(): Promise<CryptoKey> {
    if (typeof sessionStorage === 'undefined' || typeof crypto === 'undefined') {
        throw new Error('Web Crypto non disponibile in questo ambiente.');
    }

    const stored = sessionStorage.getItem(VAULT_KEY_STORAGE);
    if (stored) {
        const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
        return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    }

    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt'],
    );
    const exported = await crypto.subtle.exportKey('raw', key);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    sessionStorage.setItem(VAULT_KEY_STORAGE, b64);
    return key;
}

// ─── Vault implementation ─────────────────────────────────────────────────────

class CredentialVaultImpl {
    /**
     * Encrypt and store a provider API token/key.
     * Call this after a successful `.connect()` to persist the token.
     *
     * NEVER call this with a password — only with API tokens / JWT access tokens.
     */
    async store(providerId: string, token: string): Promise<void> {
        if (typeof localStorage === 'undefined') return;

        const key = await getOrCreateVaultKey();
        const iv  = crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder().encode(token);
        const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);

        // Pack iv + ciphertext into a single base64 blob
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(ciphertext), iv.length);
        localStorage.setItem(
            `${VAULT_PREFIX}${providerId}`,
            btoa(String.fromCharCode(...combined)),
        );
    }

    /**
     * Retrieve and decrypt a stored provider token.
     * Returns null if the vault key has expired (new session) or token is absent.
     */
    async retrieve(providerId: string): Promise<string | null> {
        if (typeof localStorage === 'undefined') return null;

        const blob = localStorage.getItem(`${VAULT_PREFIX}${providerId}`);
        if (!blob) return null;

        try {
            const key = await getOrCreateVaultKey();
            const combined = Uint8Array.from(atob(blob), (c) => c.charCodeAt(0));
            const iv         = combined.slice(0, 12);
            const ciphertext = combined.slice(12);
            const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
            return new TextDecoder().decode(plain);
        } catch {
            // Decryption failure — stale ciphertext from a previous session key
            this.remove(providerId);
            return null;
        }
    }

    /** Remove a stored credential (e.g. after explicit disconnect). */
    remove(providerId: string): void {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(`${VAULT_PREFIX}${providerId}`);
        }
    }

    /** Remove all stored credentials. */
    removeAll(): void {
        if (typeof localStorage === 'undefined') return;
        const keys = Object.keys(localStorage).filter((k) => k.startsWith(VAULT_PREFIX));
        keys.forEach((k) => localStorage.removeItem(k));
    }

    /** True if there is a stored (possibly stale) credential for this provider. */
    has(providerId: string): boolean {
        if (typeof localStorage === 'undefined') return false;
        return localStorage.getItem(`${VAULT_PREFIX}${providerId}`) !== null;
    }
}

export const credentialVault = new CredentialVaultImpl();
