# SOAK CHEAT SHEET (Quick Commands)

## Daily Monitoring

**Best UI:**
1. Enable AI Beta
2. Open AIDevToolsPanel
3. Scroll to "Post-Fase 4 Soak Metrics"

**Console (fastest):**
```ts
import { AIBrain } from '@/ai/brain/AIBrain';
const s = AIBrain.getUsageStats();
console.table(s.taskBreakdown);
console.log('Total:', s.totalCentralCalls, 'Fallback:', s.fallbackUsed);
```

**Terminal:**
```bash
npx tsx scripts/ai-usage-audit.ts
./docs/ai-soak/daily-snapshot.sh
```

## Update the Log
Append to: `docs/ai-soak/SOAK_LOG_2026-07-27.md`

## Full Check
```bash
NODE_OPTIONS="--max-old-space-size=4096" ./node_modules/.bin/tsc --noEmit
```

## Red Flags
- Fallback > 10%
- Sudden drop in calls
- New TSC errors
