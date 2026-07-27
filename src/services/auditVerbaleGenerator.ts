/**
 * auditVerbaleGenerator.ts — C11: Generatore verbale di audit PA in HTML/testo.
 *
 * Produce un verbale formale a partire da un PALiveAuditReport strutturato.
 * Il verbale è conforme al formato standard richiesto per gare PA e
 * certificazioni AI Act / GDPR.
 *
 * Output disponibili:
 *   - `generateVerbaleHTML(report)` → stringa HTML stampabile via window.print()
 *   - `generateVerbaleTXT(report)`  → testo plain per archivi / email
 *
 * Il verbale include:
 *   1. Intestazione con data, tipo (live/simulato), scenario, generato da
 *   2. Score globale e stato di conformità (CONFORME / PARZIALMENTE_CONFORME / NON_CONFORME)
 *   3. Score per framework (GDPR, AI Act, AgID)
 *   4. Findings PA (bloccanti prima, poi migliorativi)
 *   5. Raccomandazioni contestuali
 *   6. Sezione firma (placeholder per firma digitale)
 *   7. Note legali
 */

import type { PALiveAuditReport, AuditFinding } from '../self-compliance/runtime/audit/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('it-IT', {
      weekday: 'long',
      day:     '2-digit',
      month:   'long',
      year:    'numeric',
      hour:    '2-digit',
      minute:  '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusLabel(s: PALiveAuditReport['complianceStatus']): string {
  const map = {
    CONFORME:               'CONFORME',
    PARZIALMENTE_CONFORME:  'PARZIALMENTE CONFORME',
    NON_CONFORME:           'NON CONFORME',
  };
  return map[s];
}

function readinessLabel(r: PALiveAuditReport['certificationReadiness']): string {
  const map = { PRONTO: 'PRONTO', CONDIZIONATO: 'CONDIZIONATO', NON_PRONTO: 'NON PRONTO' };
  return map[r];
}

// ─── HTML generator ───────────────────────────────────────────────────────────

const HTML_STYLES = `
  <style>
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; font-size: 11pt; }
      h1 { font-size: 16pt; }
      h2 { font-size: 13pt; }
    }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1a1a1a; font-size: 12px; line-height: 1.6; }
    .header { border-bottom: 3px solid #1565c0; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #1565c0; }
    .header .subtitle { font-size: 13px; color: #555; }
    .header .meta { font-size: 11px; color: #777; margin-top: 8px; }
    .kpi-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .kpi-box { border: 1px solid #ccc; border-radius: 6px; padding: 12px 16px; flex: 1; min-width: 130px; }
    .kpi-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #777; }
    .kpi-box .value { font-size: 22px; font-weight: 700; margin-top: 2px; }
    .kpi-box.green .value { color: #2e7d32; }
    .kpi-box.orange .value { color: #e65100; }
    .kpi-box.red .value { color: #c62828; }
    .section-title { font-size: 14px; font-weight: 700; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; margin: 24px 0 12px; color: #1565c0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
    th { background: #e3f2fd; text-align: left; padding: 6px 10px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
    td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; white-space: nowrap; }
    .badge-block { background: #ffcdd2; color: #b71c1c; }
    .badge-improve { background: #fff9c4; color: #f57f17; }
    .badge-critical { background: #b71c1c; color: #fff; }
    .badge-high { background: #c62828; color: #fff; }
    .badge-medium { background: #f57f17; color: #fff; }
    .badge-low { background: #388e3c; color: #fff; }
    .badge-conforme { background: #e8f5e9; color: #1b5e20; }
    .badge-parziale { background: #fff3e0; color: #e65100; }
    .badge-nonconf { background: #ffcdd2; color: #b71c1c; }
    .recommendations ol { padding-left: 20px; }
    .recommendations li { margin-bottom: 6px; }
    .firma-box { margin-top: 40px; border: 1px dashed #bbb; border-radius: 6px; padding: 20px; text-align: center; }
    .firma-box .firma-line { display: inline-block; width: 200px; border-top: 1px solid #333; margin-top: 32px; padding-top: 4px; font-size: 10px; color: #666; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #999; }
    .finding-evidence { font-size: 10px; color: #777; margin-top: 3px; font-style: italic; }
    .finding-pa-note { font-size: 10px; color: #444; margin-top: 4px; padding-left: 8px; border-left: 2px solid #90caf9; }
  </style>
`;

function findingRows(findings: AuditFinding[]): string {
  if (findings.length === 0) {
    return '<tr><td colspan="6" style="color:#777;font-style:italic">Nessun finding rilevato.</td></tr>';
  }
  return findings.map(f => `
    <tr>
      <td><span class="badge ${f.blocking ? 'badge-block' : 'badge-improve'}">${f.blocking ? 'BLOCCANTE' : 'MIGLIORATIVO'}</span></td>
      <td><span class="badge badge-${f.severity.toLowerCase()}">${f.severity}</span></td>
      <td><strong>${f.framework}</strong> — ${f.article}</td>
      <td>
        ${escapeHtml(f.description)}
        <div class="finding-pa-note">${escapeHtml(f.paNote)}</div>
        ${f.evidence.length > 0 ? `<div class="finding-evidence">Evidenze: ${f.evidence.map(escapeHtml).join(' | ')}</div>` : ''}
      </td>
      <td>${escapeHtml(f.suggestedFix)}</td>
    </tr>
  `).join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusBadgeClass(s: PALiveAuditReport['complianceStatus']): string {
  if (s === 'CONFORME')              return 'badge-conforme';
  if (s === 'PARZIALMENTE_CONFORME') return 'badge-parziale';
  return 'badge-nonconf';
}

function scoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'orange';
  return 'red';
}

/**
 * Genera il verbale completo come stringa HTML autocontenuta (stampabile).
 */
export function generateVerbaleHTML(report: PALiveAuditReport): string {
  const blockingFindings  = report.findings.filter(f => f.blocking);
  const improvingFindings = report.findings.filter(f => !f.blocking);

  const frameworkRows = Object.entries(report.frameworkScores).map(([fw, score]) => {
    const s = score as number;
    return `
      <tr>
        <td><strong>${fw}</strong></td>
        <td>
          <div style="background:#e0e0e0;border-radius:4px;height:8px;width:100%">
            <div style="background:${s >= 80 ? '#388e3c' : s >= 60 ? '#f57f17' : '#c62828'};width:${Math.round(s)}%;height:100%;border-radius:4px"></div>
          </div>
        </td>
        <td style="font-weight:700;color:${s >= 80 ? '#2e7d32' : s >= 60 ? '#e65100' : '#c62828'}">${Math.round(s)}%</td>
      </tr>
    `;
  }).join('');

  const recommendationItems = report.recommendations
    .map(r => `<li>${escapeHtml(r)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verbale Audit PA — DocenteDoc AI</title>
  ${HTML_STYLES}
</head>
<body>

  <!-- ── Intestazione ── -->
  <div class="header">
    <h1>Verbale di Audit PA — DocenteDoc AI</h1>
    <div class="subtitle">
      Verbale formale di verifica conformità (AI Act + GDPR + AgID/CAD)
    </div>
    <div class="meta">
      Generato il: <strong>${formatDate(report.auditDate)}</strong> &nbsp;|&nbsp;
      Tipo verifica: <strong>${report.auditType === 'live' ? 'PRODUZIONE LIVE' : 'SIMULAZIONE'}</strong> &nbsp;|&nbsp;
      Scenario: <strong>${escapeHtml(report.scenarioLabel)}</strong><br>
      Generato da: ${escapeHtml(report.generatedBy)} &nbsp;|&nbsp;
      Regole valutate: ${report.passedRules}/${report.totalRules} superate
    </div>
  </div>

  <!-- ── KPI ── -->
  <div class="kpi-row">
    <div class="kpi-box ${scoreColor(report.overallScore)}">
      <div class="label">Score globale</div>
      <div class="value">${Math.round(report.overallScore)}%</div>
    </div>
    <div class="kpi-box ${report.complianceStatus === 'CONFORME' ? 'green' : report.complianceStatus === 'PARZIALMENTE_CONFORME' ? 'orange' : 'red'}">
      <div class="label">Stato conformità</div>
      <div class="value" style="font-size:14px">
        <span class="badge ${statusBadgeClass(report.complianceStatus)}">${statusLabel(report.complianceStatus)}</span>
      </div>
    </div>
    <div class="kpi-box ${report.certificationReadiness === 'PRONTO' ? 'green' : report.certificationReadiness === 'CONDIZIONATO' ? 'orange' : 'red'}">
      <div class="label">Readiness PA</div>
      <div class="value" style="font-size:14px">${readinessLabel(report.certificationReadiness)}</div>
    </div>
    <div class="kpi-box ${blockingFindings.length > 0 ? 'red' : 'green'}">
      <div class="label">Finding bloccanti</div>
      <div class="value">${blockingFindings.length}</div>
    </div>
    <div class="kpi-box ${improvingFindings.length > 0 ? 'orange' : 'green'}">
      <div class="label">Finding migliorativi</div>
      <div class="value">${improvingFindings.length}</div>
    </div>
  </div>

  <!-- ── Score per framework ── -->
  <div class="section-title">Score per framework normativo</div>
  <table>
    <thead>
      <tr>
        <th style="width:100px">Framework</th>
        <th>Andamento</th>
        <th style="width:60px">Score</th>
      </tr>
    </thead>
    <tbody>
      ${frameworkRows}
    </tbody>
  </table>

  <!-- ── Findings bloccanti ── -->
  <div class="section-title">
    Finding bloccanti (${blockingFindings.length})
    ${blockingFindings.length > 0 ? ' — IL SISTEMA NON È CERTIFICABILE SENZA RISOLVERLI' : ' — Nessuno'}
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:90px">Tipo</th>
        <th style="width:80px">Severity</th>
        <th style="width:120px">Norma</th>
        <th>Descrizione e nota PA</th>
        <th style="width:180px">Suggerimento</th>
      </tr>
    </thead>
    <tbody>
      ${findingRows(blockingFindings)}
    </tbody>
  </table>

  <!-- ── Findings migliorativi ── -->
  <div class="section-title">Finding migliorativi (${improvingFindings.length})</div>
  <table>
    <thead>
      <tr>
        <th style="width:90px">Tipo</th>
        <th style="width:80px">Severity</th>
        <th style="width:120px">Norma</th>
        <th>Descrizione e nota PA</th>
        <th style="width:180px">Suggerimento</th>
      </tr>
    </thead>
    <tbody>
      ${findingRows(improvingFindings)}
    </tbody>
  </table>

  <!-- ── Raccomandazioni ── -->
  ${report.recommendations.length > 0 ? `
  <div class="section-title">Raccomandazioni contestuali</div>
  <div class="recommendations">
    <ol>${recommendationItems}</ol>
  </div>` : ''}

  <!-- ── Firma ── -->
  <div class="firma-box">
    <div style="font-size:12px;font-weight:600;margin-bottom:8px">SEZIONE FIRME</div>
    <div style="font-size:11px;color:#555;margin-bottom:16px">
      Il presente verbale è generato automaticamente dal Self-Compliance Engine di DocenteDoc AI
      ed è valido previa firma del Responsabile Compliance PA e, se applicabile, del DPO.
    </div>
    <div style="display:flex;justify-content:space-around;flex-wrap:wrap;gap:32px">
      <div style="text-align:center">
        <div class="firma-line">Responsabile Compliance PA</div>
      </div>
      <div style="text-align:center">
        <div class="firma-line">DPO (Data Protection Officer)</div>
      </div>
      <div style="text-align:center">
        <div class="firma-line">Responsabile Trattamento Dati</div>
      </div>
    </div>
  </div>

  <!-- ── Footer legale ── -->
  <div class="footer">
    <strong>Note legali:</strong>
    Il presente documento costituisce verbale tecnico ai fini delle verifiche di conformità
    previste dal Regolamento (UE) 2024/1689 (AI Act), dal Regolamento (UE) 2016/679 (GDPR)
    e dalle Linee Guida AGID per il software pubblico. La validità legale richiede firma
    autografa o firma digitale qualificata (eIDAS) del Responsabile Compliance PA.
    Classification: CONFIDENTIAL — Distribuire esclusivamente a soggetti autorizzati.
    <br>DocenteDoc AI — Self-Compliance Engine ${new Date().getFullYear()} — ID verbale: ${report.scenarioId}-${Date.now()}
  </div>

</body>
</html>`;
}

/**
 * Genera il verbale come testo plain strutturato (per email / archivi).
 */
export function generateVerbaleTXT(report: PALiveAuditReport): string {
  const sep = '─'.repeat(72);
  const lines: string[] = [
    sep,
    'VERBALE DI AUDIT PA — DocenteDoc AI',
    sep,
    `Data:       ${formatDate(report.auditDate)}`,
    `Tipo:       ${report.auditType === 'live' ? 'PRODUZIONE LIVE' : 'SIMULAZIONE'}`,
    `Scenario:   ${report.scenarioLabel}`,
    `Generato da: ${report.generatedBy}`,
    '',
    `SCORE GLOBALE:       ${Math.round(report.overallScore)}%`,
    `STATO CONFORMITÀ:    ${statusLabel(report.complianceStatus)}`,
    `READINESS PA:        ${readinessLabel(report.certificationReadiness)}`,
    `Regole:              ${report.passedRules}/${report.totalRules} superate`,
    `Finding bloccanti:   ${report.blockingCount}`,
    `Finding migliorativi: ${report.improvingCount}`,
    '',
    '── SCORE PER FRAMEWORK ──────────────────────────────────────────────────',
    ...Object.entries(report.frameworkScores).map(
      ([fw, score]) => `  ${fw.padEnd(8)}: ${Math.round(score as number)}%`,
    ),
    '',
    '── FINDING BLOCCANTI ────────────────────────────────────────────────────',
    ...(report.findings.filter(f => f.blocking).length === 0
      ? ['  Nessun finding bloccante.']
      : report.findings.filter(f => f.blocking).map((f, i) => [
          `  ${i + 1}. [${f.severity}] ${f.framework} — ${f.article}`,
          `     Descrizione: ${f.description}`,
          `     Nota PA:     ${f.paNote}`,
          `     Suggerimento: ${f.suggestedFix}`,
          f.evidence.length > 0 ? `     Evidenze: ${f.evidence.join(', ')}` : '',
        ].filter(Boolean).join('\n'))
    ),
    '',
    '── FINDING MIGLIORATIVI ─────────────────────────────────────────────────',
    ...(report.findings.filter(f => !f.blocking).length === 0
      ? ['  Nessun finding migliorativo.']
      : report.findings.filter(f => !f.blocking).map((f, i) => [
          `  ${i + 1}. [${f.severity}] ${f.framework} — ${f.article}`,
          `     Descrizione: ${f.description}`,
          `     Suggerimento: ${f.suggestedFix}`,
        ].join('\n'))
    ),
    '',
    '── RACCOMANDAZIONI ──────────────────────────────────────────────────────',
    ...(report.recommendations.length === 0
      ? ['  Nessuna raccomandazione aggiuntiva.']
      : report.recommendations.map((r, i) => `  ${i + 1}. ${r}`)
    ),
    '',
    sep,
    'FIRME RICHIESTE:   Responsabile Compliance PA | DPO | Responsabile Trattamento',
    'CLASSIFICAZIONE:   CONFIDENTIAL',
    `ID VERBALE:        ${report.scenarioId}-${Date.now()}`,
    sep,
  ];

  return lines.join('\n');
}
