// runtime/rules/aiActRules.ts
// 5 regole AI Act eseguibili — peso complessivo 40% del live score

import type { ComplianceRule, ComplianceContext, RuleResult } from "../types";

const EXPLAINABILITY_THRESHOLD = 0.7;
const HUMAN_OVERSIGHT_THRESHOLD = 0.95;

export const AI_ACT_RULES: ComplianceRule[] = [
  {
    id: "ai_act_human_oversight",
    framework: "AI_ACT",
    article: "Art. 14",
    description: "Supervisione umana garantita su ≥95% delle azioni ad alto rischio",
    severity: "critical",
    evaluate: (ctx: ComplianceContext): RuleResult => {
      if (ctx.approvedHighRiskRatio < HUMAN_OVERSIGHT_THRESHOLD) {
        const pct = Math.round(ctx.approvedHighRiskRatio * 100);
        return {
          pass: false,
          message:
            `Supervisione umana: ${pct}% — soglia richiesta: ${HUMAN_OVERSIGHT_THRESHOLD * 100}% ` +
            `(AI Act Art. 14 — sistema ad Alto Rischio)`,
        };
      }
      return { pass: true };
    },
  },
  {
    id: "ai_act_no_unblocked_critical",
    framework: "AI_ACT",
    article: "Art. 9",
    description: "Nessuna azione a rischio critico viene eseguita senza blocco (risk management)",
    severity: "critical",
    evaluate: ctx => ({
      pass: ctx.criticalUnblocked === 0,
      message:
        ctx.criticalUnblocked > 0
          ? `${ctx.criticalUnblocked} azione/i critica/e non bloccata/e — risk management non applicato (AI Act Art. 9)`
          : undefined,
    }),
  },
  {
    id: "ai_act_transparency",
    framework: "AI_ACT",
    article: "Art. 13",
    description: `Copertura spiegabilità AI ≥ ${EXPLAINABILITY_THRESHOLD * 100}% delle azioni`,
    severity: "high",
    evaluate: (ctx: ComplianceContext): RuleResult => {
      if (ctx.explainabilityCoverage < EXPLAINABILITY_THRESHOLD) {
        const pct = Math.round(ctx.explainabilityCoverage * 100);
        return {
          pass: false,
          message:
            `Spiegabilità AI: ${pct}% — soglia: ${EXPLAINABILITY_THRESHOLD * 100}% ` +
            `(AI Act Art. 13 — sistema ad Alto Rischio deve giustificare ogni raccomandazione)`,
        };
      }
      return { pass: true };
    },
  },
  {
    id: "ai_act_logging",
    framework: "AI_ACT",
    article: "Art. 12",
    description: "Logging automatico e permanente di tutte le attività AI",
    severity: "high",
    evaluate: ctx => ({
      pass: ctx.logsAreImmutable,
      message: ctx.logsAreImmutable
        ? undefined
        : "Il sistema non garantisce logging permanente delle attività AI (AI Act Art. 12)",
    }),
  },
  {
    id: "ai_act_bias_monitoring",
    framework: "AI_ACT",
    article: "Art. 9",
    description: "Monitoraggio attivo di bias e fairness nelle raccomandazioni AI",
    severity: "medium",
    evaluate: ctx => ({
      pass: ctx.hasBiasMonitoring,
      message: ctx.hasBiasMonitoring
        ? undefined
        : "Nessun audit periodico di equità/bias — rischio discriminazione algoritmica (AI Act Art. 9)",
    }),
  },
];
