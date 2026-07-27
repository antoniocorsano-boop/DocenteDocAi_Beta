#!/usr/bin/env tsx
/**
 * ai-benchmark.ts — AI Pipeline Benchmark (Sprint 4)
 *
 * Run via:
 *   npx tsx scripts/ai-benchmark.ts
 *   npx tsx scripts/ai-benchmark.ts --classes 200 --students 25
 *
 * Flags:
 *   --classes  N   Number of synthetic classes (default: 100)
 *   --students N   Students per class (default: 20)
 *   --cold         Disable pre-warm cache pass (run cold only)
 *
 * Output: console table with per-class timing + summary stats
 */

import { generateSimulatedClasses } from '../src/ai/simulation/classGenerator';
import { runAIAnalysis } from '../src/ai/engine/aiEngine';
import { getCacheStats, clearCache } from '../src/ai/cache/aiCache';

// ── CLI arg parsing ───────────────────────────────────────────────────────────

interface BenchmarkOptions {
  classes: number;
  studentsPerClass: number;
  coldOnly: boolean;
}

function parseArgs(): BenchmarkOptions {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback: number): number => {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) return parseInt(args[idx + 1], 10) || fallback;
    return fallback;
  };
  return {
    classes: get('--classes', 100),
    studentsPerClass: get('--students', 20),
    coldOnly: args.includes('--cold'),
  };
}

// ── benchmark runner ──────────────────────────────────────────────────────────

interface RunResult {
  className: string;
  students: number;
  evals: number;
  ms: number;
  atRisk: number;
  excellent: number;
  avgGrade: number;
}

interface BenchmarkSummary {
  totalClasses: number;
  totalStudents: number;
  totalEvals: number;
  totalMs: number;
  avgMsPerClass: number;
  minMs: number;
  maxMs: number;
  p50Ms: number;
  p95Ms: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: string;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.max(0, Math.floor((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function runBenchmark(opts: BenchmarkOptions): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  DocenteDoc AI — Pipeline Benchmark`);
  console.log(`  Classes: ${opts.classes} | Students/class: ${opts.studentsPerClass}`);
  console.log(`  Mode: ${opts.coldOnly ? 'COLD only' : 'COLD then WARM (cache)'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Ensure clean state
  clearCache();

  console.log(`Generating ${opts.classes} synthetic classes...`);
  const genStart = performance.now();
  const dataset = generateSimulatedClasses({
    classes: opts.classes,
    studentsPerClass: opts.studentsPerClass,
  });
  const genMs = (performance.now() - genStart).toFixed(1);
  console.log(`✓ Dataset generated in ${genMs} ms\n`);

  // ── COLD RUN ────────────────────────────────────────────────────────────────
  console.log('── Cold run (cache empty) ───────────────────────');
  clearCache();

  const coldResults: RunResult[] = [];
  for (const cls of dataset) {
    const t0 = performance.now();
    const result = runAIAnalysis(cls.context);
    const ms = parseFloat((performance.now() - t0).toFixed(3));

    coldResults.push({
      className: cls.className,
      students: cls.students.length,
      evals: cls.evaluations.length,
      ms,
      atRisk: result.atRiskCount,
      excellent: result.excellenceCount,
      avgGrade: result.classAverage,
    });
  }

  const coldStats = getCacheStats();
  printSummary('COLD', coldResults, coldStats.hits, coldStats.misses);

  if (!opts.coldOnly) {
    // ── WARM RUN ──────────────────────────────────────────────────────────────
    console.log('\n── Warm run (cache populated) ───────────────────');
    // Re-read stats baseline
    const hitsBefore = coldStats.hits + coldStats.misses;

    const warmResults: RunResult[] = [];
    for (const cls of dataset) {
      const t0 = performance.now();
      const result = runAIAnalysis(cls.context);
      const ms = parseFloat((performance.now() - t0).toFixed(3));

      warmResults.push({
        className: cls.className,
        students: cls.students.length,
        evals: cls.evaluations.length,
        ms,
        atRisk: result.atRiskCount,
        excellent: result.excellenceCount,
        avgGrade: result.classAverage,
      });
    }

    const warmStats = getCacheStats();
    const warmHits = warmStats.hits - coldStats.hits;
    const warmMisses = warmStats.misses - coldStats.misses - hitsBefore;
    printSummary('WARM', warmResults, Math.max(0, warmHits), Math.max(0, warmMisses));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

function printSummary(
  label: string,
  results: RunResult[],
  hits: number,
  misses: number,
): void {
  const times = results.map((r) => r.ms).sort((a, b) => a - b);
  const total = times.reduce((a, b) => a + b, 0);

  const summary: BenchmarkSummary = {
    totalClasses: results.length,
    totalStudents: results.reduce((a, r) => a + r.students, 0),
    totalEvals: results.reduce((a, r) => a + r.evals, 0),
    totalMs: parseFloat(total.toFixed(2)),
    avgMsPerClass: parseFloat((total / results.length).toFixed(3)),
    minMs: times[0],
    maxMs: times[times.length - 1],
    p50Ms: percentile(times, 50),
    p95Ms: percentile(times, 95),
    cacheHits: hits,
    cacheMisses: misses,
    hitRate: hits + misses > 0 ? `${((hits / (hits + misses)) * 100).toFixed(1)}%` : 'N/A',
  };

  console.log(`\n  [${label}] Summary`);
  console.log(`  ${'─'.repeat(45)}`);
  console.log(`  Classes analyzed  : ${summary.totalClasses}`);
  console.log(`  Total students    : ${summary.totalStudents}`);
  console.log(`  Total evaluations : ${summary.totalEvals}`);
  console.log(`  ${'─'.repeat(45)}`);
  console.log(`  Total time        : ${summary.totalMs} ms`);
  console.log(`  Avg per class     : ${summary.avgMsPerClass} ms`);
  console.log(`  Min / Max         : ${summary.minMs} ms / ${summary.maxMs} ms`);
  console.log(`  p50 / p95         : ${summary.p50Ms} ms / ${summary.p95Ms} ms`);
  console.log(`  ${'─'.repeat(45)}`);
  console.log(`  Cache hits        : ${summary.cacheHits}`);
  console.log(`  Cache misses      : ${summary.cacheMisses}`);
  console.log(`  Hit rate          : ${summary.hitRate}`);

  // Flag slow outliers (>50 ms)
  const slow = results.filter((r) => r.ms > 50);
  if (slow.length > 0) {
    console.log(`\n  ⚠  Slow classes (>50 ms): ${slow.length}`);
    for (const r of slow.slice(0, 5)) {
      console.log(`     ${r.className}: ${r.ms} ms (${r.students} student, ${r.evals} eval)`);
    }
  } else {
    console.log(`\n  ✓ No slow classes detected (all < 50 ms)`);
  }
}

// ── entry point ───────────────────────────────────────────────────────────────

const opts = parseArgs();
runBenchmark(opts);
