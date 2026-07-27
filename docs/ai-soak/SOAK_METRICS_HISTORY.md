# SOAK METRICS HISTORY

Track key numbers here over time (update every 1-3 days).

| Date       | Total Calls | buildPrompt | generateCentral | Fallback | Fallback % | # Active Tasks | Notes |
|------------|-------------|-------------|-----------------|----------|------------|----------------|-------|
| 2026-07-27 | (baseline from prior) | — | — | low | low | multiple | Soak launch + panel live |
|            |             |             |                 |          |            |                |       |
|            |             |             |                 |          |            |                |       |
|            |             |             |                 |          |            |                |       |
|            |             |             |                 |          |            |                |       |
|            |             |             |                 |          |            |                |       |

## How to fill

Use:
```ts
const s = AIBrain.getUsageStats();
console.log({
  total: s.totalCentralCalls,
  build: s.buildPrompt,
  gen: s.generateWithCentralPrompt,
  fb: s.fallbackUsed,
  tasks: Object.keys(s.taskBreakdown).length
});
```

**Goal:** See steady growth with low fallback.
