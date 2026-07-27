// runtime/rules/agidRules.ts
// 3 regole AgID / CAD eseguibili — peso complessivo 20% del live score

import type { ComplianceRule, ComplianceContext, RuleResult } from "../types";

const MAX_DECISION_TIME_MS = 10_000;

export const AGID_RULES: ComplianceRule[] = [
  {
    id: "agid_audit_logging",
    framework: "AGID",
    article: "AgID Linee Guida IA § 4.2",
    description: "Log di audit conformi alle linee guida AgID — immutabili e accessibili",
    severity: "high",
    evaluate: ctx => ({
      pass: ctx.logsAreImmutable,
      message: ctx.logsAreImmutable
        ? undefined
        : "I log di audit non rispettano i requisiti AgID di immutabilità e tracciabilità",
    }),
  },
  {
    id: "agid_traceability",
    framework: "AGID",
    article: "CAD Art. 32 / AgID § 3.1",
    description: "Almeno un ciclo di audit eseguito — tracciabilità delle decisioni AI verificabile",
    severity: "medium",
    evaluate: ctx => ({
      pass: ctx.lastAuditDate !== null,
      message:
        ctx.lastAuditDate === null
          ? "Nessun ciclo di audit eseguito — le decisioni AI non sono tracciabili (CAD Art. 32)"
          : undefined,
    }),
  },
  {
    id: "agid_response_time",
    framework: "AGID",
    article: "AgID Linee Guida Performance § 2.1",
    description: `Latenza media decisioni AI < ${MAX_DECISION_TIME_MS / 1000}s`,
    severity: "low",
    evaluate: (ctx: ComplianceContext): RuleResult => {
      if (ctx.totalActions === 0 || ctx.avgDecisionTimeMs < MAX_DECISION_TIME_MS) {
        return { pass: true };
      }
      return {
        pass: false,
        message:
          `Latenza media: ${Math.round(ctx.avgDecisionTimeMs)}ms — ` +
          `soglia AgID: < ${MAX_DECISION_TIME_MS}ms per sistemi AI in PA`,
      };
    },
  },
];
