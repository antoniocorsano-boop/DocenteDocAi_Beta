/**
 * trustLayer/trustStamp.ts
 *
 * Genera il "timbro trust" da appendere a documenti PDF/HTML.
 *
 * Il timbro include:
 *   - ID record trust
 *   - Hash SHA-256 (primissimi 32 char visibili)
 *   - Timestamp e tenant
 *   - Link di verifica (locale)
 *
 * Uso: importare trustStampHtml() o trustStampText() in qualunque
 * generatore di documenti (verbale, DPIA, Sales Pack).
 */

import type { TrustRecord } from './types';

// ─── HTML stamp ───────────────────────────────────────────────────────────────

/**
 * Genera il blocco HTML del timbro trust da inserire nei documenti esportati.
 * Include stili inline per compatibilità print.
 */
export function trustStampHtml(record: TrustRecord | null | undefined): string {
  if (!record) {
    return `
      <div style="
        margin-top:40px; padding:12px 16px;
        border:1px solid #e0e0e0; border-radius:6px;
        background:#fafafa; font-size:10px; color:#999;
        font-family:'Roboto Mono','Courier New',monospace;
      ">
        ⚠ Trust Layer: nessun record disponibile — documento non tracciato.
      </div>`;
  }

  const hashShort   = record.hash.slice(0, 32);
  const dateStr     = new Date(record.timestamp).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return `
    <div style="
      margin-top:40px; padding:14px 18px;
      border:2px solid #1565c0; border-radius:6px;
      background:#e3f2fd; page-break-inside:avoid;
    ">
      <div style="
        font-size:11px; font-weight:700; color:#1565c0;
        margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;
      ">🔒 Trust Layer — Integrità documento verificata</div>
      <table style="width:100%;font-size:10px;color:#333;
        font-family:'Roboto Mono','Courier New',monospace;border-collapse:collapse;">
        <tr>
          <td style="padding:2px 8px 2px 0;color:#666;white-space:nowrap">Record ID</td>
          <td style="padding:2px 0">${escHtml(record.id)}</td>
        </tr>
        <tr>
          <td style="padding:2px 8px 2px 0;color:#666;white-space:nowrap">SHA-256</td>
          <td style="padding:2px 0">${hashShort}…</td>
        </tr>
        <tr>
          <td style="padding:2px 8px 2px 0;color:#666;white-space:nowrap">Timestamp</td>
          <td style="padding:2px 0">${dateStr} (epoch: ${record.timestamp})</td>
        </tr>
        <tr>
          <td style="padding:2px 8px 2px 0;color:#666;white-space:nowrap">Tenant</td>
          <td style="padding:2px 0">${escHtml(record.tenantId)}</td>
        </tr>
        <tr>
          <td style="padding:2px 8px 2px 0;color:#666;white-space:nowrap">Attore</td>
          <td style="padding:2px 0">${escHtml(record.actorId)}</td>
        </tr>
        <tr>
          <td style="padding:2px 8px 2px 0;color:#666;white-space:nowrap">Evento</td>
          <td style="padding:2px 0">${escHtml(record.eventType)}</td>
        </tr>
        <tr>
          <td style="padding:2px 8px 2px 0;color:#666;white-space:nowrap">Prev-Hash</td>
          <td style="padding:2px 0">${record.prevHash ? record.prevHash.slice(0, 32) + '…' : '(primo record della catena)'}</td>
        </tr>
      </table>
      <div style="margin-top:8px;font-size:9px;color:#888">
        Verifica integrità: pannello Admin → Trust Layer → "Verifica catena"
      </div>
    </div>`;
}

/**
 * Versione testo del timbro trust (per verbali TXT, report plain-text).
 */
export function trustStampText(record: TrustRecord | null | undefined): string {
  if (!record) {
    return '\n\n⚠ TRUST LAYER: nessun record — documento non tracciato.\n';
  }

  const dateStr = new Date(record.timestamp).toLocaleString('it-IT');
  return `
═══════════════════════════════════════════════════════════════════════
 TRUST LAYER — Integrità documento verificata
═══════════════════════════════════════════════════════════════════════
 Record ID    : ${record.id}
 SHA-256      : ${record.hash.slice(0, 32)}…
 Timestamp    : ${dateStr} (epoch: ${record.timestamp})
 Tenant       : ${record.tenantId}
 Attore       : ${record.actorId}
 Evento       : ${record.eventType}
 Prev-Hash    : ${record.prevHash ? record.prevHash.slice(0, 32) + '…' : '(primo record)'}
───────────────────────────────────────────────────────────────────────
 Verifica: pannello Admin → Trust Layer → "Verifica catena"
═══════════════════════════════════════════════════════════════════════`;
}

// ─── utils ────────────────────────────────────────────────────────────────────

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
