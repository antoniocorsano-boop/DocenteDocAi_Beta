// runtime/scoring/liveScorer.ts
// Calcola il live score ponderato per framework

import type { ComplianceRule, FrameworkScore, RuleFramework } from "../types";
import { FRAMEWORK_WEIGHTS } from "../rules";

type EvaluatedRule = {
  rule: ComplianceRule;
  pass: boolean;
};

function clamp(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
}

/** Calcola i punteggi per framework e il live score globale ponderato. */
export function computeLiveScore(evaluated: EvaluatedRule[]): {
  liveScore: number;
  frameworkScores: Record<RuleFramework, FrameworkScore>;
} {
  const frameworks: RuleFramework[] = ["GDPR", "AI_ACT", "AGID"];

  const frameworkScores = {} as Record<RuleFramework, FrameworkScore>;

  for (const fw of frameworks) {
    const fwRules  = evaluated.filter(e => e.rule.framework === fw);
    const passed   = fwRules.filter(e => e.pass).length;
    const total    = fwRules.length;
    const score    = total > 0 ? clamp((passed / total) * 100) : 100;
    const weight   = FRAMEWORK_WEIGHTS[fw];

    frameworkScores[fw] = { framework: fw, weight, passed, total, score };
  }

  const liveScore = clamp(
    frameworks.reduce(
      (sum, fw) => sum + frameworkScores[fw].score * frameworkScores[fw].weight,
      0,
    ),
  );

  return { liveScore, frameworkScores };
}
