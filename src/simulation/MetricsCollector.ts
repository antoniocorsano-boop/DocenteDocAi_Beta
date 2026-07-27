/**
 * simulation/MetricsCollector.ts — Raccolta metriche della simulazione.
 *
 * Classe pura senza side-effect. Usata da JarvisSimulator per accumulare
 * dati e da SimulationPanel per mostrare statistiche live.
 */

import type { SimulationMetrics } from './types';

export class MetricsCollector {
  private _logs: SimulationMetrics[] = [];

  log(metric: SimulationMetrics): void {
    this._logs.push(metric);
  }

  getAll(): SimulationMetrics[] {
    return [...this._logs];
  }

  getLast(n: number): SimulationMetrics[] {
    return this._logs.slice(-n);
  }

  getAvgResponseTimeMs(): number {
    if (this._logs.length === 0) return 0;
    const total = this._logs.reduce((s, m) => s + m.responseTimeMs, 0);
    return Math.round(total / this._logs.length);
  }

  getSkillHitRate(): number {
    if (this._logs.length === 0) return 0;
    const hits = this._logs.filter(m => m.skillTriggered !== 'none').length;
    return Math.round((hits / this._logs.length) * 100);
  }

  getLandingRate(): number {
    if (this._logs.length === 0) return 0;
    const shown = this._logs.filter(m => m.landingShown).length;
    return Math.round((shown / this._logs.length) * 100);
  }

  getAvgContentDensity(): number {
    if (this._logs.length === 0) return 0;
    const total = this._logs.reduce((s, m) => s + m.contentDensity, 0);
    return Math.round((total / this._logs.length) * 10) / 10;
  }

  /** Esporta i dati come CSV per analisi esterna. */
  exportCSV(): string {
    if (this._logs.length === 0) return '';
    const keys    = Object.keys(this._logs[0]) as (keyof SimulationMetrics)[];
    const headers = keys.join(',');
    const rows    = this._logs.map(m => keys.map(k => String(m[k])).join(','));
    return [headers, ...rows].join('\n');
  }

  clear(): void {
    this._logs = [];
  }

  get count(): number {
    return this._logs.length;
  }
}
