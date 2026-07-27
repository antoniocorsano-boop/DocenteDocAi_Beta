/**
 * trustLayer/trustHash.ts
 *
 * Funzioni di hashing per il Trust Layer.
 *
 * Usa Web Crypto API (SHA-256) disponibile in tutti i browser moderni e
 * in Node.js 16+. Le funzioni sono async per rispettare l'API nativa.
 *
 * Per i test sincroni locali viene fornita anche una versione sincrona
 * basata su un semplice djb2 hash (NON usare in produzione per sicurezza —
 * solo come fallback / test determinism).
 */

// ─── Web Crypto (produzione) ──────────────────────────────────────────────────

/**
 * Calcola lo SHA-256 di una stringa e restituisce il digest in hex.
 * Usa SubtleCrypto se disponibile, altrimenti fallback djb2.
 */
export async function sha256Hex(input: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const encoder = new TextEncoder();
    const data    = encoder.encode(input);
    const hashBuf = await globalThis.crypto.subtle.digest('SHA-256', data);
    const bytes   = Array.from(new Uint8Array(hashBuf));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback determinisico per ambienti senza SubtleCrypto (es. test JS DOM)
  return djb2Hex(input);
}

/**
 * Versione sincrona: djb2 come fallback deterministico.
 * 8 byte → 16 caratteri hex, preceduti da 'djb2:' per identificazione.
 * NON equivalente a SHA-256 per sicurezza.
 */
export function djb2Hex(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
    h = h >>> 0; // mantieni 32-bit unsigned
  }
  return 'djb2:' + h.toString(16).padStart(8, '0');
}

// ─── Record hash ──────────────────────────────────────────────────────────────

/**
 * Calcola l'hash di un TrustRecord escludendo il campo `hash` stesso.
 * Input: serializzazione JSON canonica (chiavi ordinate).
 */
export async function computeRecordHash(data: {
  id:          string;
  timestamp:   number;
  eventType:   string;
  tenantId:    string;
  actorId:     string;
  description: string;
  payload:     Record<string, unknown>;
  prevHash:    string;
}): Promise<string> {
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return sha256Hex(canonical);
}
