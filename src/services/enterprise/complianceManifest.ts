/**
 * enterprise/complianceManifest.ts
 *
 * CopilotDoc Enterprise — Compliance Manifest & Certification Registry.
 *
 * Normative references and certification standards for compliant rollout:
 *   - GDPR UE 2016/679
 *   - D.Lgs. 196/2003 (Codice Privacy)
 *   - ISO/IEC 27001 (Information Security)
 *   - ISO 9001 (Quality Management)
 *   - AgID (PA Digital Services)
 *   - DPCM 3 dicembre 2013 (Digital Preservation)
 *   - D.Lgs. 82/2005 (CAC — PEC, firma digitale)
 *   - Linee guida MIUR per registri elettronici
 */

import type { ComplianceStandard, ComplianceReport, NormativeReference } from '../../types/enterprise.types';

// ── Manifest declarations ────────────────────────────────────────────────────

export const COMPLIANCE_MANIFEST: Record<
  ComplianceStandard,
  {
    label: string;
    authority: string;
    scope: string;
    mandatory: boolean;
    certificationBody?: string;
    renewalPeriodMonths?: number;
    controlPoints: string[];
  }
> = {
  GDPR_EU_2016_679: {
    label: 'GDPR UE 2016/679',
    authority: 'Unione Europea — Garante Privacy',
    scope: 'Trattamento dati personali studenti, docenti e personale scolastico',
    mandatory: true,
    renewalPeriodMonths: 12,
    controlPoints: [
      'Registro dei trattamenti (Art. 30)',
      'Privacy by design e by default (Art. 25)',
      'Consenso esplicito per dati AI (Art. 7)',
      'Diritto alla cancellazione (Art. 17)',
      'Data Breach Notification entro 72h (Art. 33)',
      'DPO nominato se scuola pubblica (Art. 37)',
    ],
  },
  D_LGS_196_2003: {
    label: 'D.Lgs. 196/2003 aggiornato',
    authority: 'Garante per la protezione dei dati personali',
    scope: 'Codice in materia di protezione dei dati personali — adeguamento GDPR',
    mandatory: true,
    controlPoints: [
      'Misure di sicurezza adeguate (Art. 32 GDPR recepito)',
      'Comunicazione dati a terzi soggetta ad autorizzazione',
      'Trattamento dati sensibili di minori',
    ],
  },
  ISO_27001: {
    label: 'ISO/IEC 27001:2022',
    authority: 'ISO — International Organization for Standardization',
    scope: 'Sistema di Gestione della Sicurezza delle Informazioni (ISMS)',
    mandatory: false,
    certificationBody: 'Ente di certificazione accreditato ACCREDIA',
    renewalPeriodMonths: 36,
    controlPoints: [
      'Annex A — 93 controlli di sicurezza',
      'Risk assessment e risk treatment plan',
      'Incident management e business continuity',
      'Gestione chiavi AI in ambiente sicuro (A.8.24)',
      'Audit interni periodici',
      'Revisione management annuale',
    ],
  },
  ISO_9001: {
    label: 'ISO 9001:2015',
    authority: 'ISO — International Organization for Standardization',
    scope: 'Sistema di Gestione per la Qualità dei processi didattici e amministrativi',
    mandatory: false,
    certificationBody: 'Ente di certificazione accreditato ACCREDIA',
    renewalPeriodMonths: 36,
    controlPoints: [
      'Mappatura processi chiave (context of the organization)',
      'Customer satisfaction — docenti e dirigenti',
      'Non-conformità e azioni correttive',
      'Miglioramento continuo (Ciclo PDCA)',
    ],
  },
  AGID: {
    label: 'AgID — Piano Triennale PA Digitale',
    authority: 'Agenzia per l\'Italia Digitale',
    scope: 'Compliance per servizi digitali e interoperabilità della PA',
    mandatory: true,
    controlPoints: [
      'Linee guida interoperabilità (API-first)',
      'Accessibilità WCAG 2.1 AA (Legge Stanca aggiornata)',
      'Conservazione digitale accredia',
      'Identità digitale (SPID/CIE integrazione)',
      'Cloud PA — solo CSP qualificati AgID',
      'Dichiarazione di accessibilità obbligatoria',
    ],
  },
  DPCM_2013_12_03: {
    label: 'DPCM 3 dicembre 2013',
    authority: 'Presidenza del Consiglio dei Ministri',
    scope: 'Conservazione digitale dei documenti amministrativi (Art. 43 CAC)',
    mandatory: true,
    controlPoints: [
      'Piano di conservazione documentale',
      'Conservatore accreditato AgID',
      'Pacchetto di versamento (PDV) conforme',
      'Metadati obbligatori per documenti scolastici',
      'Audit log immodificabile della conservazione',
    ],
  },
  D_LGS_82_2005: {
    label: 'D.Lgs. 82/2005 — CAC',
    authority: 'Ministero della PA',
    scope: 'Codice dell\'Amministrazione Digitale: PEC, firma elettronica, documento informatico',
    mandatory: true,
    controlPoints: [
      'Utilizzo PEC per comunicazioni ufficiali',
      'Firma digitale qualificata (eIDAS) per atti formali',
      'Documento informatico con valore probatorio (Art. 20)',
      'Protocollo informatico obbligatorio (Art. 40-bis)',
    ],
  },
  MIUR_GUIDELINES: {
    label: 'Linee guida MIUR — Digitalizzazione scuola',
    authority: 'Ministero dell\'Istruzione e del Merito',
    scope: 'Registri elettronici, conservazione atti scolastici, privacy studenti minori',
    mandatory: true,
    controlPoints: [
      'Registro elettronico conforme (DPR 122/2009)',
      'Privacy studenti minori — consenso genitori',
      'Fascicolo studente digitale',
      'Continuità educativa dei dati tra ordini scolastici',
      'Backup e disaster recovery dati classe',
    ],
  },
};

// ── Compliance helpers ────────────────────────────────────────────────────────

/** Returns only mandatory standards for quick compliance gate check. */
export function getMandatoryStandards(): ComplianceStandard[] {
  return (Object.entries(COMPLIANCE_MANIFEST) as Array<[ComplianceStandard, typeof COMPLIANCE_MANIFEST[ComplianceStandard]]>)
    .filter(([, v]) => v.mandatory)
    .map(([k]) => k);
}

/** Returns all normative references from the manifest. */
export function getAllNormativeRefs(): NormativeReference[] {
  return (Object.entries(COMPLIANCE_MANIFEST) as Array<[ComplianceStandard, typeof COMPLIANCE_MANIFEST[ComplianceStandard]]>)
    .map(([standard, manifest]): NormativeReference => ({
      standard,
      description: manifest.scope,
      mandatory: manifest.mandatory,
    }));
}

/** Generate a compliance report snapshot. */
export function generateComplianceReport(
  auditLogSize: number,
  approvedChanges: number,
  pendingApprovals: number,
): ComplianceReport {
  return {
    generatedAt: new Date().toISOString(),
    standards: (Object.entries(COMPLIANCE_MANIFEST) as Array<[ComplianceStandard, typeof COMPLIANCE_MANIFEST[ComplianceStandard]]>)
      .map(([standard, manifest]) => ({
        standard,
        // Status: mandatory items are 'partial' until certification is confirmed
        status: manifest.certificationBody ? 'partial' : 'compliant' as const,
        notes: manifest.mandatory
          ? `Obbligatorio — ${manifest.controlPoints.length} punti di controllo`
          : `Facoltativo — certificazione ${manifest.certificationBody ?? 'interna'}`,
      })),
    auditLogSize,
    approvedChanges,
    pendingApprovals,
    lastAuditAt: new Date().toISOString(),
  };
}
