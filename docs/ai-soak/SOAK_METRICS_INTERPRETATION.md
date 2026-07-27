# How to Read Soak Metrics

## Key Numbers Explained

| Metric                        | What it means                              | Good sign                          | Warning sign                  |
|-------------------------------|--------------------------------------------|------------------------------------|-------------------------------|
| `totalCentralCalls`           | Total times the new central path was used  | Steady growth day over day         | Flat or dropping              |
| `buildPrompt`                 | How many times prompts were built          | Roughly matches generate calls     | Much lower than generate      |
| `generateWithCentralPrompt`   | Actual AI generations via central path     | Increasing                         | Stagnant                      |
| `fallbackUsed`                | Times we fell back to legacy code          | Low and stable                     | Rising or high (>8-10%)       |
| `taskBreakdown`               | Usage per task (lesson-enrich, etc.)       | Several tasks with good volume     | Only 1-2 tasks being used     |

## Quick Health Check

Run this in console:

```ts
const s = AIBrain.getUsageStats();
const fb = s.totalCentralCalls ? (s.fallbackUsed / s.totalCentralCalls * 100) : 0;

console.log("Health Check");
console.log("Total calls:", s.totalCentralCalls);
console.log("Fallback rate:", fb.toFixed(1) + "%");
console.log("Top tasks:", Object.keys(s.taskBreakdown).length);
```

**Green:**
- Total calls growing
- Fallback < 8%
- 5+ different tasks with usage

**Yellow:**
- Slow growth
- Fallback 8-12%
- Only 2-3 tasks active

**Red:**
- Fallback > 12%
- Sudden drop in calls
- Errors appearing

## Recommended Thresholds for Soak Exit

See `SOAK_EXIT_CRITERIA.md`
