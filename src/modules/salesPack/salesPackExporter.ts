/**
 * salesPackExporter.ts
 *
 * Export professionale dei Sales Pack in PDF (via window.print) e copia testo.
 *
 * Funzioni pubbliche:
 *  - exportOnePagerPDF(pack)        → apre finestra di stampa con one-pager
 *  - exportAuditPDF(pack)           → apre finestra di stampa con verbale audit HTML
 *  - exportFullPackHTML(pack)       → HTML completo con tutti i documenti
 *  - exportFullPackPDF(pack)        → stampa HTML completo
 *  - copyDocumentText(text)         → copia testo negli appunti
 *
 * Tecnologia: HTML → print (nativo browser, produce PDF via "Salva come PDF").
 * Non richiede librerie aggiuntive — compatibile con jsPDF per future estensioni.
 *
 * Ogni documento è PA-ready:
 *  - intestazione formale
 *  - timestamp generazione
 *  - ID documento tracciabile
 *  - classificazione CONFIDENTIAL
 */

import type { SalesPack } from './types';
import { slog }           from '../../utils/structuredLogger';
import { trustStampHtml, trustStampText } from '../trustLayer/trustStamp';
import { useTrustStore }  from '../trustLayer/trustStore';

/** Recupera l'ultimo trust record relativo a questo pack, se presente.
 * Usa getByTenant() (full TrustRecord con .payload) invece di listMeta(). */
function packTrustRecord(pack: SalesPack) {
  const allRecords = useTrustStore.getState().getByTenant(pack.tenantId);
  return allRecords.find(
    r => r.eventType === 'PACK_CREATED' &&
      (r.payload as Record<string, unknown>)?.packId === pack.id,
  ) ?? useTrustStore.getState().getHead(pack.tenantId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('it-IT', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const PRINT_BASE_STYLES = `
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 40px; color: #1a1a1a; font-size: 12px; line-height: 1.7;
    }
    .doc-header {
      border-bottom: 3px solid #1565c0; padding-bottom: 14px;
      margin-bottom: 24px; display: flex;
      justify-content: space-between; align-items: flex-end;
    }
    .doc-header h1 { font-size: 18px; color: #1565c0; margin: 0 0 4px; }
    .doc-header .meta { font-size: 10px; color: #888; text-align: right; }
    pre {
      white-space: pre-wrap; word-break: break-word;
      font-family: 'Roboto Mono', 'Courier New', monospace;
      font-size: 11px; line-height: 1.6; background: #f8f8f8;
      border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px;
    }
    .section { margin-top: 32px; }
    .section-title {
      font-size: 13px; font-weight: 700; color: #1565c0;
      border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; margin-bottom: 12px;
    }
    .footer {
      margin-top: 40px; padding-top: 14px; border-top: 1px solid #eee;
      font-size: 9px; color: #bbb;
    }
    .kpi-row { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .kpi-box {
      border: 1px solid #ccc; border-radius: 6px; padding: 10px 14px;
      flex: 1; min-width: 120px;
    }
    .kpi-box .label { font-size: 9px; text-transform: uppercase; color: #888; }
    .kpi-box .value { font-size: 18px; font-weight: 700; }
    .green { color: #2e7d32; } .orange { color: #e65100; } .red { color: #c62828; }
  </style>
`;

function docHeader(title: string, pack: SalesPack): string {
  return `
    <div class="doc-header">
      <div>
        <h1>${title}</h1>
        <div style="font-size:11px;color:#555">DocenteDoc AI — Self-Compliance Engine</div>
      </div>
      <div class="meta">
        Generato: ${formatDate(pack.createdAt)}<br>
        ID: ${pack.id}<br>
        Versione: v${pack.version} | Tenant: ${pack.tenantId}<br>
        Autore: ${pack.createdBy}<br>
        CONFIDENTIAL
      </div>
    </div>
  `;
}

function kpiRow(pack: SalesPack): string {
  const scoreColor = pack.complianceScore >= 80 ? 'green' : pack.complianceScore >= 60 ? 'orange' : 'red';
  const statusLabel =
    pack.complianceStatus === 'CONFORME' ? 'Conforme'
    : pack.complianceStatus === 'PARZIALMENTE_CONFORME' ? 'Parzialmente conforme'
    : 'Non conforme';
  return `
    <div class="kpi-row">
      <div class="kpi-box"><div class="label">Compliance</div>
        <div class="value ${scoreColor}">${pack.complianceScore}%</div></div>
      <div class="kpi-box"><div class="label">Stato PA</div>
        <div class="value" style="font-size:12px">${statusLabel}</div></div>
      <div class="kpi-box"><div class="label">Versione</div>
        <div class="value">v${pack.version}</div></div>
      <div class="kpi-box"><div class="label">AI</div>
        <div class="value ${pack.aiEnabled ? 'green' : 'orange'}">${pack.aiEnabled ? 'Attiva' : 'Off'}</div></div>
    </div>
  `;
}

function footer(pack: SalesPack): string {
  return `
    <div class="footer">
      DocenteDoc AI Sales Pack &nbsp;|&nbsp; ID: ${pack.id} &nbsp;|&nbsp;
      Generato: ${formatDate(pack.createdAt)} &nbsp;|&nbsp;
      Classification: CONFIDENTIAL &nbsp;|&nbsp;
      &copy; ${new Date().getFullYear()} DocenteDoc AI
    </div>
  `;
}

function printHtml(html: string, title: string): void {
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed', top: '-9999px', left: '-9999px', width: '0', height: '0',
  });
  document.body.appendChild(iframe);
  iframe.contentDocument?.open();
  iframe.contentDocument?.write(html);
  iframe.contentDocument?.close();
  iframe.contentDocument!.title = title;
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 5000);
  }, 400);
}

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Esporta il one-pager come PDF tramite finestra di stampa del browser.
 * Include il timbro Trust Layer.
 */
export function exportOnePagerPDF(pack: SalesPack): void {
  slog.info('AUDIT', 'exportOnePagerPDF avviato', { id: pack.id });
  const trustRecord = packTrustRecord(pack);
  const trustId = trustRecord?.id;
  const fullRecord = trustId ? useTrustStore.getState().getById(trustId) : undefined;
  const html = `<!DOCTYPE html><html lang="it"><head>
    <meta charset="UTF-8"><title>One Pager — DocenteDoc AI</title>
    ${PRINT_BASE_STYLES}
  </head><body>
    ${docHeader('ONE PAGER — DocenteDoc AI', pack)}
    ${kpiRow(pack)}
    <pre>${escHtml(pack.onePager)}</pre>
    ${trustStampHtml(fullRecord ?? null)}
    ${footer(pack)}
  </body></html>`;
  printHtml(html, 'One Pager DocenteDoc AI');
}

/**
 * Esporta il demo script come PDF.
 */
export function exportDemoScriptPDF(pack: SalesPack): void {
  slog.info('AUDIT', 'exportDemoScriptPDF avviato', { id: pack.id });
  const html = `<!DOCTYPE html><html lang="it"><head>
    <meta charset="UTF-8"><title>Demo Script — DocenteDoc AI</title>
    ${PRINT_BASE_STYLES}
  </head><body>
    ${docHeader('DEMO SCRIPT — DocenteDoc AI', pack)}
    <pre>${escHtml(pack.demoScript)}</pre>
    ${footer(pack)}
  </body></html>`;
  printHtml(html, 'Demo Script DocenteDoc AI');
}

/**
 * Esporta il verbale audit PA come PDF (usa l'HTML già generato).
 */
export function exportAuditPDF(pack: SalesPack): void {
  slog.info('AUDIT', 'exportAuditPDF avviato', { id: pack.id });
  // Il verbale HTML è già autocontenuto (include stili) — lo stampiamo direttamente
  printHtml(pack.auditVerbaleHTML, 'Verbale Audit PA — DocenteDoc AI');
}

/**
 * Genera un HTML unico con tutti i documenti del pack (full bundle).
 * Include il timbro Trust Layer come ultima sezione.
 */
export function exportFullPackHTML(pack: SalesPack): string {
  const trustRecord = packTrustRecord(pack);
  const trustId = trustRecord?.id;
  const fullRecord = trustId ? useTrustStore.getState().getById(trustId) : undefined;

  return `<!DOCTYPE html><html lang="it"><head>
    <meta charset="UTF-8"><title>Sales Pack Completo — DocenteDoc AI v${pack.version}</title>
    ${PRINT_BASE_STYLES}
    <style>
      .doc-section { page-break-before: always; margin-top: 0; }
      .doc-section:first-child { page-break-before: avoid; }
    </style>
  </head><body>

    <!-- ── Copertina ── -->
    ${docHeader(`SALES PACK COMPLETO — v${pack.version}`, pack)}
    ${kpiRow(pack)}
    <div style="margin:24px 0;padding:16px;background:#e3f2fd;border-radius:6px;">
      <strong>Indice documenti inclusi:</strong><br>
      1. One Pager &nbsp;|&nbsp;
      2. Demo Script &nbsp;|&nbsp;
      3. DPIA GDPR Art.35 &nbsp;|&nbsp;
      4. Verbale Audit PA &nbsp;|&nbsp;
      5. Report Compliance &nbsp;|&nbsp;
      6. Timbro Trust Layer
    </div>

    <!-- ── 1. One Pager ── -->
    <div class="doc-section">
      <div class="section-title">1 — ONE PAGER</div>
      <pre>${escHtml(pack.onePager)}</pre>
    </div>

    <!-- ── 2. Demo Script ── -->
    <div class="doc-section">
      <div class="section-title">2 — DEMO SCRIPT</div>
      <pre>${escHtml(pack.demoScript)}</pre>
    </div>

    <!-- ── 3. DPIA ── -->
    <div class="doc-section">
      <div class="section-title">3 — DPIA GDPR ART.35</div>
      <pre>${escHtml(pack.dpia)}</pre>
    </div>

    <!-- ── 4. Verbale Audit (testo) ── -->
    <div class="doc-section">
      <div class="section-title">4 — VERBALE AUDIT PA</div>
      <pre>${escHtml(pack.auditVerbaleTXT)}</pre>
    </div>

    <!-- ── 5. Report Compliance ── -->
    <div class="doc-section">
      <div class="section-title">5 — REPORT COMPLIANCE GDPR / AI ACT / AGID</div>
      <pre>${escHtml(pack.complianceReport)}</pre>
    </div>

    <!-- ── 6. Trust Layer Stamp ── -->
    <div class="doc-section">
      <div class="section-title">6 — TIMBRO TRUST LAYER</div>
      ${trustStampHtml(fullRecord ?? null)}
    </div>

    ${footer(pack)}
  </body></html>`;
}

/**
 * Genera il verbale audit TXT con timbro trust appeso in coda.
 * Utile per export testo puro con tracciabilità.
 */
export function exportAuditTxtWithTrust(pack: SalesPack): string {
  const trustRecord = packTrustRecord(pack);
  const trustId = trustRecord?.id;
  const fullRecord = trustId ? useTrustStore.getState().getById(trustId) : undefined;
  return pack.auditVerbaleTXT + trustStampText(fullRecord ?? null);
}

/**
 * Stampa il pack completo come PDF (tutti i documenti, con salto pagina).
 */
export function exportFullPackPDF(pack: SalesPack): void {
  slog.info('AUDIT', 'exportFullPackPDF avviato', { id: pack.id, version: pack.version });
  printHtml(exportFullPackHTML(pack), `Sales Pack v${pack.version} — DocenteDoc AI`);
}

/**
 * Copia il testo di un documento negli appunti.
 */
export async function copyDocumentText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── utils ────────────────────────────────────────────────────────────────────

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
