// runtime/audit/severityMapper.ts
// Mappa i livelli di severità interni ai livelli PA (uppercase) e determina il carattere bloccante

import type { RuleSeverity } from "../types";
import type { PASeverityLevel } from "./types";

/** Mappa severity interna → livello PA */
const SEVERITY_MAP: Record<RuleSeverity, PASeverityLevel> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
  low:      "Low",
};

/** Converte un livello di severity interno nel livello PA corrispondente. */
export function mapToPASeverity(severity: RuleSeverity): PASeverityLevel {
  return SEVERITY_MAP[severity];
}

/**
 * Un finding è "bloccante" quando impedisce la certificazione PA.
 * Corrispondono ai livelli Critical e High — richiedono risoluzione obbligatoria.
 */
export function isBlockingFinding(paLevel: PASeverityLevel): boolean {
  return paLevel === "Critical" || paLevel === "High";
}
