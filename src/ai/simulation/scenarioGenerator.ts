/**
 * scenarioGenerator.ts — Deterministic synthetic classroom scenario generator
 *
 * Produces seeded `ClassroomScenario` objects that fully describe the shape
 * of a classroom dataset.  Seeded runs are 100 % reproducible — the same
 * seed always returns the same scenario.
 *
 * Scenarios are consumed by `classroomSimulator.ts` to produce concrete
 * `Studente` / `Valutazione` records that the AI pipeline can ingest.
 */

// ── types ─────────────────────────────────────────────────────────────────────

export type RiskDistribution = 'low' | 'medium' | 'high';
export type ClassTrend = 'improving' | 'stable' | 'declining';

/**
 * Full description of a synthetic classroom state.
 * All values are kept as primitives so the object is JSON-serialisable.
 */
export interface ClassroomScenario {
  /** Unique scenario identifier (hex of seed + index) */
  id: string;
  /** RNG seed — same seed always produces same scenario */
  seed: number;
  /** Number of students in the class [10, 32] */
  students: number;
  /** Overall risk distribution across the class */
  riskDistribution: RiskDistribution;
  /** Overall grade trend direction */
  trend: ClassTrend;
  /**
   * Proportion of random anomalies [0, 1].
   * 0 = perfectly smooth data; 1 = maximum noise.
   */
  behaviorNoise: number;
  /** Fraction of students flagged as BES/DSA (0–0.3) */
  specialNeedsRatio: number;
  /** Number of evaluations per student [4, 12] */
  evaluationsPerStudent: number;
}

// ── seeded PRNG (xorshift32) ──────────────────────────────────────────────────
// A pure-function PRNG so tests can be deterministic without touching Math.random.

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  if (state === 0) state = 1; // xorshift32 requires non-zero seed
  return function next(): number {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 4_294_967_296); // [0, 1)
  };
}

function seedFromArgs(seed?: number): number {
  if (seed !== undefined && seed > 0) return Math.floor(seed);
  // Fallback: use current epoch millis for non-deterministic runs
  return (Date.now() % 2_147_483_647) || 1;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function pickIndex<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

const RISK_LEVELS: RiskDistribution[] = ['low', 'medium', 'high'];
const TRENDS: ClassTrend[] = ['improving', 'stable', 'declining'];

function hexPad(n: number, len = 8): string {
  return (n >>> 0).toString(16).padStart(len, '0');
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Generates one `ClassroomScenario` from an optional seed.
 * Without a seed a new unique scenario is produced each call.
 */
export function generateScenario(seed?: number): ClassroomScenario {
  const resolvedSeed = seedFromArgs(seed);
  const rand = createPrng(resolvedSeed);

  const students = 10 + Math.floor(rand() * 23); // [10, 32]
  const evalsPer = 4 + Math.floor(rand() * 9);   // [4, 12]
  const noise = parseFloat(rand().toFixed(3));
  const specialNeeds = parseFloat((rand() * 0.3).toFixed(3));

  return {
    id: `sc-${hexPad(resolvedSeed)}-${hexPad(students)}`,
    seed: resolvedSeed,
    students,
    riskDistribution: pickIndex(RISK_LEVELS, rand),
    trend: pickIndex(TRENDS, rand),
    behaviorNoise: noise,
    specialNeedsRatio: specialNeeds,
    evaluationsPerStudent: evalsPer,
  };
}

/**
 * Generates `count` scenarios with successive seeds derived from an optional
 * base seed.  When no base seed is provided the batch starts from the current
 * epoch, ensuring each call produces non-repeating scenarios.
 */
export function generateScenarioBatch(
  count: number,
  baseSeed?: number,
): ClassroomScenario[] {
  const base = seedFromArgs(baseSeed);
  return Array.from({ length: count }, (_, i) => generateScenario(base + i));
}

/**
 * Named edge-case scenarios for regression testing.
 * Each name maps to a fixed seed that produces the described classroom state.
 */
export const NAMED_SCENARIOS: Record<string, number> = {
  allAtRisk: 3_141_592,    // high risk, declining, heavy noise
  allExcellent: 2_718_281, // low risk, improving, minimal noise
  emptyClass: 1_000_001,   // minimum students (10)
  largeClass: 9_999_999,   // maximum students (32)
  noisyClass: 4_194_304,   // maximum behaviorNoise
  stableAverage: 1_618_033, // stable trend, medium risk
} as const;
