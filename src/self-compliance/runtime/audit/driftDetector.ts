// runtime/audit/driftDetector.ts
// Rileva la deriva (drift) del compliance score confrontando run production_live successivi.

import type { AuditRun, DriftReport } from "./types";
import type { UseCaseId } from "../../../cognition/useCaseTelemetry";
import { getComplianceHotspots, USE_CASE_LABELS } from "../../../cognition/useCaseTelemetry";

/** Delta minimo di punti per considerare un cambiamento significativo */
const SIGNIFICANCE_THRESHOLD = 2;

/**
 * Analizza la storia degli audit e calcola il drift del compliance score.
 * Confronta il run production_live più recente con quello precedente.
 * I run di simulazione (scenario diverso da "production_live") sono esclusi.
 *
 * @param runs  Lista completa dei run nello store (più recenti in testa)
 */
export function detectDrift(runs: AuditRun[]): DriftReport {
  const liveRuns = runs.filter(r => r.scenarioId === "production_live");

  if (liveRuns.length === 0) {
    return {
      status:        "stable",
      delta:          0,
      recentScore:    0,
      previousScore:  null,
      message:        "Nessun audit live registrato — esegui il primo audit in produzione.",
    };
  }

  const recent   = liveRuns[0];
  const previous = liveRuns[1] ?? null;

  if (!previous) {
    return {
      status:        "stable",
      delta:          0,
      recentScore:    recent.score,
      previousScore:  null,
      message:        `Baseline stabilita a ${recent.score}/100 — esegui altri audit per rilevare il trend.`,
    };
  }

  const delta = recent.score - previous.score;

  if (delta > SIGNIFICANCE_THRESHOLD) {
    return {
      status:        "improving",
      delta,
      recentScore:    recent.score,
      previousScore:  previous.score,
      message:        `Score migliorato di +${delta} pts (${previous.score} → ${recent.score}).`,
    };
  }

  if (delta < -SIGNIFICANCE_THRESHOLD) {
    return {
      status:        "degrading",
      delta,
      recentScore:    recent.score,
      previousScore:  previous.score,
      message:        `Score degradato di ${Math.abs(delta)} pts (${previous.score} → ${recent.score}) — verificare le ultime modifiche.`,
    };
  }

  return {
    status:        "stable",
    delta,
    recentScore:    recent.score,
    previousScore:  previous.score,
    message:        `Score stabile (Δ${delta >= 0 ? "+" : ""}${delta}) rispetto all'audit precedente.`,
  };
}

// ── Use Case-aware drift ──────────────────────────────────────────────────────

/**
 * Analizza il drift di compliance per un singolo Use Case, usando i dati di
 * `useCaseTelemetry`. Utile per insight del tipo "UC-V1 ha il 60% delle violazioni".
 *
 * @param useCaseId  Use Case da analizzare (es. 'UC-V1')
 * @returns DriftReport con messaggi contestualizzati per il Use Case
 */
export function detectDriftByUseCase(useCaseId: UseCaseId): DriftReport {
  const hotspots = getComplianceHotspots();
  const summary  = hotspots.find(h => h.useCaseId === useCaseId);
  const label    = USE_CASE_LABELS[useCaseId] ?? useCaseId;

  if (!summary || summary.totalEvents === 0) {
    return {
      status:        "stable",
      delta:          0,
      recentScore:    100,
      previousScore:  null,
      message:        `${label} — nessun evento telemetria registrato ancora.`,
    };
  }

  const cumDelta = summary.avgComplianceDelta;

  if (cumDelta > SIGNIFICANCE_THRESHOLD) {
    return {
      status:        "improving",
      delta:          cumDelta,
      recentScore:    Math.min(100, 50 + cumDelta),
      previousScore:  50,
      message:        `${label} — compliance in miglioramento (Δ+${cumDelta.toFixed(1)}).`,
    };
  }

  if (cumDelta < -SIGNIFICANCE_THRESHOLD) {
    const failRate = summary.totalEvents > 0
      ? Math.round((summary.complianceFailures / summary.totalEvents) * 100)
      : 0;
    return {
      status:        "degrading",
      delta:          cumDelta,
      recentScore:    Math.max(0, 50 + cumDelta),
      previousScore:  50,
      message:        `${label} — genera il ${failRate}% delle violazioni (Δ${cumDelta.toFixed(1)}). Verificare flusso.`,
    };
  }

  return {
    status:        "stable",
    delta:          cumDelta,
    recentScore:    50,
    previousScore:  50,
    message:        `${label} — stable (${summary.completed} completati, ${summary.complianceFailures} fallimenti compliance).`,
  };
}
