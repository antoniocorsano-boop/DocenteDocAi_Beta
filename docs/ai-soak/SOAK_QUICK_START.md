# SOAK QUICK START — How to Monitor (2026-07-27)

## 1. Best way: Use the Live Panel (recommended)

1. Activate **AI Beta / Experimental** mode in Settings → Advanced
2. Open the **AIDevToolsPanel** (usually available in the Copilot / Dev section)
3. Scroll down to the section titled **"Post-Fase 4 Soak Metrics"**
4. Watch the live numbers (auto-updates every 30 seconds)

This is the easiest way for teachers/devs to see adoption in real time.

## 2. Quick console check

```ts
import { AIBrain } from '@/ai/brain/AIBrain';

const stats = AIBrain.getUsageStats();
console.table(stats.taskBreakdown);
console.log('Total calls:', stats.totalCentralCalls);
console.log('Fallback %:', ((stats.fallbackUsed / (stats.totalCentralCalls||1)) * 100).toFixed(1));
```

## 3. Periodic audit (terminal)

```bash
npx tsx scripts/ai-usage-audit.ts
```

## 4. Full invariant + type check

```bash
NODE_OPTIONS="--max-old-space-size=4096" ./node_modules/.bin/tsc --noEmit
```

## Daily routine during soak

- Check the panel once or twice a day
- Run the audit script every 2–3 days
- Fill the log in `docs/ai-soak/SOAK_LOG_*.md`
- Keep TSC clean

**Current state at start of soak:** All invariants respected. Monitoring tools are ready.
