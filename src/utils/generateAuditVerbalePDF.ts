/**
 * generateAuditVerbalePDF.ts
 * Genera un verbale PA formale in PDF a partire dal PALiveAuditReport + GovernanceConfig.
 * Usa jsPDF (lazy-loaded) — segue lo stesso pattern di TestPreviewModal.tsx.
 *
 * Layout A4 portrait:
 *   Header band   — titolo + sistema + org + versione
 *   Meta line     — data, tipo, scenario, regole
 *   Two-column    — governance roles ‹|› score + status + cert
 *   Framework scores bar chart
 *   Findings cards (bloccanti in evidenza)
 *   Raccomandazioni numerate
 *   Signature block — DPO · Resp. AI · Resp. Audit
 *   Footer paginato
 *
 * Colori: valori RGB fissi — jsPDF non supporta CSS variables.
 * Questi colori sono equivalenti ai token MD3 per sola generazione PDF.
 */
import type { jsPDF as JsPDFType } from 'jspdf';
import type { PALiveAuditReport } from '../self-compliance/runtime/audit';
import type { GovernanceConfig }  from '../self-compliance/governance';

// ── Color constants (MD3 token equivalents, fixed RGB for jsPDF) ─────────────

type RGB = readonly [number, number, number];

const C_PRIMARY:   RGB = [25,  118, 210];
const C_ERROR:     RGB = [211, 47,  47];
const C_WARNING:   RGB = [230, 81,  0];
const C_SUCCESS:   RGB = [56,  142, 60];
const C_TEXT:      RGB = [33,  33,  33];
const C_SUBTEXT:   RGB = [97,  97,  97];
const C_SURFACE:   RGB = [245, 245, 245];
const C_SURFACE_E: RGB = [255, 235, 235];   // error-container equiv
const C_OUTLINE:   RGB = [200, 200, 200];
const C_WHITE:     RGB = [255, 255, 255];

function forStatus(status: string): RGB {
  if (status === 'CONFORME')              return C_SUCCESS;
  if (status === 'PARZIALMENTE_CONFORME') return C_WARNING;
  return C_ERROR;
}

function forScore(score: number): RGB {
  if (score >= 80) return C_SUCCESS;
  if (score >= 60) return C_WARNING;
  return C_ERROR;
}

function forSeverity(sev: string): RGB {
  if (sev === 'Critical' || sev === 'High') return C_ERROR;
  if (sev === 'Medium')                     return C_WARNING;
  return C_SUCCESS;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateAuditVerbalePDF(
  report:     PALiveAuditReport,
  governance: GovernanceConfig,
): Promise<void> {
  const jsPdfModule = await import('jspdf');
  const jsPDF = jsPdfModule.jsPDF as typeof JsPDFType;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PW = 210;
  const PH = 297;
  const ML = 14;
  const MR = PW - 14;
  const CW = MR - ML;
  let y = 0;

  // ── Inline helpers ──────────────────────────────────────────────────────────
  function fill(c: RGB): void { doc.setFillColor(c[0], c[1], c[2]); }
  function stroke(c: RGB): void { doc.setDrawColor(c[0], c[1], c[2]); }
  function tColor(c: RGB): void { doc.setTextColor(c[0], c[1], c[2]); }

  function checkPage(need = 20): void {
    if (y + need > PH - 18) {
      doc.addPage();
      y = 22;
    }
  }

  function hRule(): void {
    stroke(C_OUTLINE);
    doc.setLineWidth(0.2);
    doc.line(ML, y, MR, y);
    y += 4;
  }

  function sectionTitle(label: string): void {
    checkPage(12);
    fill(C_SURFACE);
    doc.rect(ML, y, CW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    tColor(C_PRIMARY);
    doc.text(label.toUpperCase(), ML + 2, y + 5);
    tColor(C_TEXT);
    doc.setFont('helvetica', 'normal');
    y += 9;
  }

  // ── HEADER BAND ─────────────────────────────────────────────────────────────
  fill(C_PRIMARY);
  doc.rect(0, 0, PW, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  tColor(C_WHITE);
  doc.text('VERBALE DI AUDIT — SISTEMA AI', ML, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `${governance.systemName}  ·  ${governance.organizationName}  ·  v${governance.version}`,
    ML, 21,
  );
  tColor(C_TEXT);
  y = 32;

  // ── Meta line ───────────────────────────────────────────────────────────────
  const auditDate = new Date(report.auditDate).toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const auditTime = new Date(report.auditDate).toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit',
  });
  doc.setFontSize(8);
  tColor(C_SUBTEXT);
  doc.text(
    `Data: ${auditDate} ${auditTime}  ·  Tipo: ${report.auditType}  ·  Scenario: ${report.scenarioLabel}  ·  Regole: ${report.passedRules}/${report.totalRules}`,
    ML, y,
  );
  tColor(C_TEXT);
  y += 6;
  hRule();

  // ── TWO-COLUMN: Governance + Score ──────────────────────────────────────────
  const govStartY = y;
  const colMid    = ML + CW * 0.58;

  // Left column: governance roles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  tColor(C_PRIMARY);
  doc.text('GOVERNANCE E RESPONSABILITÀ', ML, y);
  y += 5;

  const roles: [string, string][] = [
    ['DPO (GDPR Art. 37)',        governance.dpo],
    ['Resp. AI (AI Act Art. 9)',  governance.aiOfficer],
    ['Titolare del Trattamento',  governance.processorName],
    ['Resp. Audit Interno',       governance.auditResponsible],
  ];

  doc.setFont('helvetica', 'normal');
  tColor(C_TEXT);
  for (const [label, value] of roles) {
    doc.setFontSize(6.5);
    tColor(C_SUBTEXT);
    doc.text(label + ':', ML, y);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    tColor(C_TEXT);
    doc.text(value || '—', ML, y + 3.5);
    doc.setFont('helvetica', 'normal');
    y += 8;
  }

  // Right column: score (absolute position)
  const scoreRGB   = forStatus(report.complianceStatus);
  const statusMap: Record<string, string> = {
    'CONFORME':              'CONFORME',
    'PARZIALMENTE_CONFORME': 'PARZ. CONFORME',
    'NON_CONFORME':          'NON CONFORME',
  };
  const certMap: Record<string, string> = {
    'PRONTO':       'PRONTO',
    'CONDIZIONATO': 'CONDIZIONATO',
    'NON_PRONTO':   'NON PRONTO',
  };

  const scoreX = colMid + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  tColor(scoreRGB);
  doc.text(String(report.overallScore), scoreX, govStartY + 14);
  doc.setFontSize(10);
  doc.text('/100', scoreX + 20, govStartY + 14);

  fill(scoreRGB);
  doc.rect(scoreX, govStartY + 17, 34, 7, 'F');
  doc.setFontSize(7);
  tColor(C_WHITE);
  doc.text(
    statusMap[report.complianceStatus] ?? report.complianceStatus,
    scoreX + 2, govStartY + 22.5,
  );

  doc.setFont('helvetica', 'normal');
  tColor(C_SUBTEXT);
  doc.setFontSize(7);
  doc.text(
    `Cert: ${certMap[report.certificationReadiness] ?? report.certificationReadiness}`,
    scoreX, govStartY + 29,
  );

  const bColor = report.blockingCount > 0 ? C_ERROR : C_SUCCESS;
  tColor(bColor);
  doc.text(
    `${report.blockingCount} blocc.  ·  ${report.improvingCount} migl.`,
    scoreX, govStartY + 34,
  );

  tColor(C_TEXT);
  y = Math.max(y, govStartY + 40);
  hRule();

  // ── FRAMEWORK SCORES ────────────────────────────────────────────────────────
  sectionTitle('Framework Scores');

  const fwNames: Record<string, string> = {
    GDPR:   'GDPR',
    AI_ACT: 'AI Act',
    AGID:   'AgID',
  };

  for (const [fw, score] of Object.entries(report.frameworkScores) as [string, number][]) {
    checkPage(10);
    const fwColor = forScore(score);
    const barX    = ML + 22;
    const barW    = CW - 42;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    tColor(C_TEXT);
    doc.text(fwNames[fw] ?? fw, ML, y + 4);

    fill(C_SURFACE);
    doc.rect(barX, y + 1, barW, 4, 'F');
    fill(fwColor);
    doc.rect(barX, y + 1, barW * (score / 100), 4, 'F');

    doc.setFontSize(8);
    tColor(fwColor);
    doc.text(`${score}/100`, MR - 14, y + 4);
    tColor(C_TEXT);
    y += 8;
  }
  hRule();

  // ── FINDINGS ────────────────────────────────────────────────────────────────
  sectionTitle(
    `Criticità PA — ${report.findings.length} rilevate  ·  ${report.blockingCount} bloccanti`,
  );

  if (report.findings.length === 0) {
    doc.setFontSize(8);
    tColor(C_SUCCESS);
    doc.text('Nessuna criticità rilevata — sistema certificabile.', ML, y);
    tColor(C_TEXT);
    y += 8;
  } else {
    for (const f of report.findings) {
      checkPage(26);
      const sevRGB = forSeverity(f.severity);

      // Card background
      if (f.blocking) {
        fill(C_SURFACE_E);
      } else {
        fill(C_SURFACE);
      }
      doc.rect(ML, y, CW, 22, 'F');

      // Left accent for blocking
      if (f.blocking) {
        fill(C_ERROR);
        doc.rect(ML, y, 2, 22, 'F');
      }

      // Severity badge
      fill(sevRGB);
      doc.rect(ML + 3, y + 2, 18, 5, 'F');
      doc.setFontSize(6);
      tColor(C_WHITE);
      doc.text(f.severity.toUpperCase(), ML + 5, y + 5.8);

      // BLOCCANTE badge
      if (f.blocking) {
        fill(C_ERROR);
        doc.rect(ML + 23, y + 2, 22, 5, 'F');
        tColor(C_WHITE);
        doc.text('BLOCCANTE', ML + 25, y + 5.8);
      }

      // Framework + article
      const fwBadgeEnd = f.blocking ? ML + 47 : ML + 24;
      doc.setFontSize(6.5);
      tColor(C_SUBTEXT);
      doc.text(
        `${fwNames[f.framework] ?? f.framework}  ·  ${f.article}`,
        fwBadgeEnd, y + 5.8,
      );

      // Description (max 2 lines)
      tColor(C_TEXT);
      doc.setFont('helvetica', 'normal').setFontSize(7);
      const descLines = doc.splitTextToSize(f.description, CW - 6) as string[];
      doc.text(descLines.slice(0, 2), ML + 3, y + 13);

      // First evidence
      if (f.evidence.length > 0) {
        doc.setFontSize(6);
        tColor(C_SUBTEXT);
        doc.text(`▸ ${f.evidence[0]}`, ML + 3, y + 20);
      }

      tColor(C_TEXT);
      y += 24;
    }
  }
  hRule();

  // ── RECOMMENDATIONS ─────────────────────────────────────────────────────────
  sectionTitle(`Raccomandazioni — ${report.recommendations.length}`);

  for (let i = 0; i < report.recommendations.length; i++) {
    checkPage(12);
    doc.setFont('helvetica', 'normal').setFontSize(7.5);
    tColor(C_TEXT);
    const lines = doc.splitTextToSize(
      `${i + 1}. ${report.recommendations[i]}`,
      CW - 4,
    ) as string[];
    doc.text(lines, ML + 2, y);
    y += lines.length * 5 + 2;
  }
  y += 4;
  hRule();

  // ── SIGNATURE BLOCK ──────────────────────────────────────────────────────────
  checkPage(42);
  sectionTitle('Firme — Validazione Governance');

  const sigRoles = [
    { label: 'DPO (GDPR Art. 37)',  name: governance.dpo },
    { label: 'Resp. AI (AI Act)',   name: governance.aiOfficer },
    { label: 'Resp. Audit Interno', name: governance.auditResponsible },
  ];
  const sigW = (CW - 8) / 3;

  for (let i = 0; i < sigRoles.length; i++) {
    const sigX = ML + i * (sigW + 4);
    doc.setFontSize(7);
    tColor(C_SUBTEXT);
    doc.text(sigRoles[i].label, sigX, y);
    tColor(C_TEXT);
    doc.setFont('helvetica', 'bold').setFontSize(8);
    doc.text(sigRoles[i].name, sigX, y + 5);
    stroke(C_OUTLINE);
    doc.setLineWidth(0.3);
    doc.line(sigX, y + 16, sigX + sigW, y + 16);
    doc.setFont('helvetica', 'normal').setFontSize(6);
    tColor(C_SUBTEXT);
    doc.text('Firma', sigX, y + 20);
  }

  // ── PAGE FOOTERS (all pages) ─────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    tColor(C_SUBTEXT);
    doc.text(
      `DocenteDoc AI — Verbale Audit PA — ${auditDate}  |  Pag. ${p}/${totalPages}`,
      ML, PH - 8,
    );
  }

  // ── DOWNLOAD ─────────────────────────────────────────────────────────────────
  const dateStr  = new Date().toISOString().split('T')[0];
  const filename = `verbale-audit-pa_${governance.systemName.replace(/\s+/g, '-').toLowerCase()}_${dateStr}.pdf`;
  doc.save(filename);
}
