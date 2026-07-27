// runtime/rules/index.ts
// Raccolta di tutte le regole — ordine: GDPR → AI_ACT → AGID

import { GDPR_RULES }    from "./gdprRules";
import { AI_ACT_RULES }  from "./aiActRules";
import { AGID_RULES }    from "./agidRules";
import type { ComplianceRule } from "../types";

export { GDPR_RULES, AI_ACT_RULES, AGID_RULES };

/** Array completo di tutte le regole (13 totali). */
export const ALL_RULES: ComplianceRule[] = [
  ...GDPR_RULES,
  ...AI_ACT_RULES,
  ...AGID_RULES,
];

/** Mapping pesi per framework. */
export const FRAMEWORK_WEIGHTS = {
  GDPR:   0.40,
  AI_ACT: 0.40,
  AGID:   0.20,
} as const;
