# SOAK HEALTH CHECK (Quick Daily)

Run this mentally or in console every day:

```ts
const s = AIBrain.getUsageStats();
const fbRate = s.totalCentralCalls ? (s.fallbackUsed / s.totalCentralCalls * 100).toFixed(1) : 0;

console.log("=== SOAK HEALTH ===");
console.log("Total calls:", s.totalCentralCalls);
console.log("Fallback rate:", fbRate + "%");
console.log("Active tasks:", Object.keys(s.taskBreakdown).length);
```

**Green flags**
- Total calls growing
- Fallback < 8%
- 4+ tasks with usage

**Yellow**
- Slow growth
- Fallback 8-12%

**Red**
- Fallback > 12%
- Sudden drop

Update the log with your findings.
