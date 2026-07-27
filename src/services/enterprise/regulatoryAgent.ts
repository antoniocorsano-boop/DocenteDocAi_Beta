/**
 * enterprise/regulatoryAgent.ts
 *
 * Regulatory Agent — first stage of the CopilotDoc Enterprise pipeline.
 *
 * Responsibilities:
 *   1. Parse official documents (MIUR circolari, ministerial decrees, official records)
 *   2. Extract normative references (GDPR articles, CAC provisions, MIUR guidelines)
 *   3. Create structured KG knowledge nodes pending human approval
 *   4. Generate role-specific summary reports (Segreteria / Docente / Dirigente)
 *
 * Safety: all KG writes are staged as ApprovalRequests — nothing reaches the
 * Knowledge Graph Enterprise until a human approves (see approvalGate.ts).
 */

import type {
  RegulatoryDocument,
  NormativeReference,
  AgentResult,
  ApprovalLevel,
  ComplianceStandard,
} from '../../types/enterprise.types';

// ── Normative reference catalogue ─────────────────────────────────────────────

const NORMATIVE_CATALOGUE: Array<{
  keywords: string[];
  ref: NormativeReference;
}> = [
  {
    keywords: ['gdpr', '2016/679', 'protezione dei dati', 'data protection'],
    ref: {
      standard: 'GDPR_EU_2016_679',
      article: 'Art. 5-9',
      description: 'Trattamento dati personali studenti e personale scolastico',
      mandatory: true,
    },
  },
  {
    keywords: ['196/2003', 'codice privacy', 'd.lgs. 196'],
    ref: {
      standard: 'D_LGS_196_2003',
      article: 'Art. 2-ter',
      description: 'Codice in materia di protezione dei dati personali',
      mandatory: true,
    },
  },
  {
    keywords: ['iso 27001', 'sicurezza informazioni', 'information security'],
    ref: {
      standard: 'ISO_27001',
      description: 'Sistema di Gestione della Sicurezza delle Informazioni',
      mandatory: false,
    },
  },
  {
    keywords: ['iso 9001', 'gestione qualità', 'quality management'],
    ref: {
      standard: 'ISO_9001',
      description: 'Sistema di Gestione per la Qualità dei processi',
      mandatory: false,
    },
  },
  {
    keywords: ['agid', 'agenzia per l\'italia digitale', 'codice del consumo digitale'],
    ref: {
      standard: 'AGID',
      description: 'Compliance AgID per servizi digitali della Pubblica Amministrazione',
      mandatory: true,
    },
  },
  {
    keywords: ['dpcm 3 dicembre 2013', 'conservazione digitale', 'art. 43'],
    ref: {
      standard: 'DPCM_2013_12_03',
      article: 'Art. 43',
      description: 'Conservazione digitale certificata dei documenti amministrativi',
      mandatory: true,
    },
  },
  {
    keywords: ['82/2005', 'cac', 'pec', 'firma digitale', 'codice dell\'amministrazione'],
    ref: {
      standard: 'D_LGS_82_2005',
      article: 'Art. 20-23',
      description: 'Documento informatico, PEC e firma digitale',
      mandatory: true,
    },
  },
  {
    keywords: ['miur', 'ministero dell\'istruzione', 'registro elettronico', 'linee guida'],
    ref: {
      standard: 'MIUR_GUIDELINES',
      description: 'Linee guida MIUR per registri elettronici e conservazione digitale',
      mandatory: true,
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function nanoid(): string {
  return `ent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function extractNormativeRefs(text: string): NormativeReference[] {
  const lower = text.toLowerCase();
  const found: NormativeReference[] = [];
  const seen = new Set<ComplianceStandard>();
  for (const entry of NORMATIVE_CATALOGUE) {
    if (entry.keywords.some(kw => lower.includes(kw)) && !seen.has(entry.ref.standard)) {
      found.push(entry.ref);
      seen.add(entry.ref.standard);
    }
  }
  return found;
}

function extractSections(text: string): string[] {
  // Split on common Italian normative section markers
  return text
    .split(/\n(?=art\.|articolo|sezione|capitolo|\d+\.|punto)/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function inferApprovalLevel(source: RegulatoryDocument['source']): ApprovalLevel {
  switch (source) {
    case 'government':
    case 'ministerial_decree': return 'governo';
    case 'miur':               return 'ministry';
    case 'circular':           return 'dirigente';
    default:                   return 'segreteria';
  }
}

function buildReport(
  doc: RegulatoryDocument,
  refs: NormativeReference[],
  sections: string[],
): Record<ApprovalLevel, string> {
  const mandatoryCount = refs.filter(r => r.mandatory).length;
  const sectionCount   = sections.length;

  return {
    segreteria: [
      `Documento "${doc.title}" ricevuto da ${doc.source.toUpperCase()}.`,
      `Trovati ${sectionCount} articoli/sezioni e ${mandatoryCount} riferimenti normativi obbligatori.`,
      `Azione richiesta: revisione e approvazione per aggiornamento archivio.`,
    ].join(' '),

    dirigente: [
      `Circolare/normativa: "${doc.title}".`,
      `Impatto istituzionale: ${mandatoryCount} norme obbligatorie identificate.`,
      refs.length > 0
        ? `Standard coinvolti: ${refs.map(r => r.standard).join(', ')}.`
        : 'Nessun riferimento normativo specifico rilevato.',
      `Richiedere approvazione per aggiornamento Knowledge Graph Enterprise.`,
    ].join(' '),

    ministry: [
      `Analisi documento normativo "${doc.title}".`,
      `${refs.length} riferimenti normativi estratti.`,
      `Aggiornamento locale obbligatorio richiesto prima della distribuzione.`,
    ].join(' '),

    governo: [
      `Documento di livello governativo "${doc.title}".`,
      `Trend macro-analisi: ${refs.filter(r => !r.mandatory).length} standard raccomandati da aggiungere.`,
      `Allineamento policy multi-istituto in corso.`,
    ].join(' '),
  };
}

// ── Regulatory Agent implementation ──────────────────────────────────────────

export class RegulatoryAgent {
  /**
   * Parse a regulatory document and produce an AgentResult.
   * The result contains staged KG node data and role-specific reports.
   * All data is pending approval — nothing is written to the KG directly.
   */
  parse(doc: RegulatoryDocument): AgentResult {
    const sessionId       = nanoid();
    const refs            = extractNormativeRefs(doc.rawText);
    const sections        = extractSections(doc.rawText);
    const approvalLevel   = inferApprovalLevel(doc.source);
    const reports         = buildReport(doc, refs, sections);

    const kgNodeStubs = sections.slice(0, 10).map((section, i) => ({
      id:         `kg_reg_${sessionId}_${i}`,
      type:       'REGULATORY_PROVISION' as const,
      label:      section.slice(0, 80),
      source:     doc.source,
      documentId: doc.id,
      pending:    true,   // ← not written until approved
    }));

    return {
      agentRole:        'regulatory',
      sessionId,
      producedAt:       new Date().toISOString(),
      ok:               true,
      summary:          reports[approvalLevel],
      normativeRefs:    refs,
      kgNodes:          kgNodeStubs.map(n => n.id),
      requiresApproval: true,
      approvalLevel,
      data: {
        documentId:    doc.id,
        source:        doc.source,
        title:         doc.title,
        sectionCount:  sections.length,
        normsFound:    refs.length,
        mandatoryNorms: refs.filter(r => r.mandatory).length,
        reports,
        kgNodeStubs,
        extractedRefs: refs,
      },
      recommendations: [
        refs.length > 0
          ? `Aggiornare le policy interne in base a ${refs.filter(r => r.mandatory).length} norme obbligatorie.`
          : 'Nessuna norma obbligatoria rilevata in questo documento.',
        'Notificare Segreteria e Dirigente per revisione e approvazione.',
        'Conservare documento digitale come da DPCM 3 dicembre 2013.',
      ],
    };
  }
}

export const regulatoryAgent = new RegulatoryAgent();
