// runtime/rules/gdprRules.ts
// 5 regole GDPR eseguibili — peso complessivo 40% del live score

import type { ComplianceRule, ComplianceContext, RuleResult } from "../types";

export const GDPR_RULES: ComplianceRule[] = [
  {
    id: "gdpr_no_violations",
    framework: "GDPR",
    article: "Art. 33",
    description: "Nessuna violazione GDPR attiva nel log delle attività",
    severity: "critical",
    evaluate: ctx => ({
      pass: ctx.gdprViolations === 0,
      message:
        ctx.gdprViolations > 0
          ? `${ctx.gdprViolations} violazione/i GDPR attiva/e — notifica DPO entro 72h (GDPR Art. 33)`
          : undefined,
    }),
  },
  {
    id: "gdpr_data_retention",
    framework: "GDPR",
    article: "Art. 5(1)(e)",
    description: "Policy di retention automatica attiva (limitazione della conservazione)",
    severity: "high",
    evaluate: ctx => ({
      pass: ctx.hasDataRetentionPolicy,
      message: ctx.hasDataRetentionPolicy
        ? undefined
        : "Nessuna policy di retention automatica — i dati vengono conservati a tempo indefinito",
    }),
  },
  {
    id: "gdpr_lawful_basis",
    framework: "GDPR",
    article: "Art. 6",
    description: "Meccanismo di consenso/informativa presente per base giuridica del trattamento",
    severity: "high",
    evaluate: ctx => ({
      pass: ctx.hasPrivacyConsent,
      message: ctx.hasPrivacyConsent
        ? undefined
        : "Nessun meccanismo di raccolta consenso — base giuridica del trattamento non verificabile",
    }),
  },
  {
    id: "gdpr_audit_freshness",
    framework: "GDPR",
    article: "Art. 5(2)",
    description: "Ciclo di audit eseguito nell'ultimo mese (principio di responsabilizzazione)",
    severity: "medium",
    evaluate: (ctx: ComplianceContext): RuleResult => {
      if (ctx.lastAuditDaysAgo === null) {
        return { pass: false, message: "Nessun audit di compliance eseguito — accountability non dimostrabile" };
      }
      if (ctx.lastAuditDaysAgo > 30) {
        return {
          pass: false,
          message: `Ultimo audit ${ctx.lastAuditDaysAgo} giorni fa — GDPR Art. 5(2) richiede verifica regolare`,
        };
      }
      return { pass: true };
    },
  },
  {
    id: "gdpr_immutable_logs",
    framework: "GDPR",
    article: "Art. 5(1)(f)",
    description: "I log di trattamento sono immutabili e integri (integrità e riservatezza)",
    severity: "high",
    evaluate: ctx => ({
      pass: ctx.logsAreImmutable,
      message: ctx.logsAreImmutable
        ? undefined
        : "I log di trattamento non sono protetti da modifiche — rischio integrità (GDPR Art. 5(1)(f))",
    }),
  },
];
