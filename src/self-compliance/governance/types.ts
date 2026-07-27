// governance/types.ts
// Governance formale — ruoli e responsabilità per conformità AI Act + GDPR

/**
 * Configurazione governance del sistema DocenteDoc AI.
 * Alimenta il verbale PDF e il pannello governance del CopilotPanel.
 *
 * Riferimenti:
 *   - DPO:              GDPR Art. 37
 *   - aiOfficer:        AI Act Art. 9(2) — sistema gestione del rischio
 *   - auditResponsible: AI Act Art. 17 — sistema di qualità
 *   - processorName:    GDPR Art. 4(7) — titolare del trattamento
 */
export type GovernanceConfig = {
  systemName:       string;
  organizationName: string;
  version:          string;
  /** ISO date YYYY-MM-DD */
  lastReview:       string;
  dpo:              string;
  aiOfficer:        string;
  auditResponsible: string;
  processorName:    string;
};
