#!/bin/bash
# Daily Soak Snapshot - run this to record current state

echo "=== SOAK DAILY SNAPSHOT - $(date -Iseconds) ==="
echo ""
echo "TSC errors: $(NODE_OPTIONS="--max-old-space-size=4096" ./node_modules/.bin/tsc --noEmit 2>&1 | grep -c "error TS" || echo 0)"
echo "Post-Fase 4 blocks: $(grep -r 'AIBrain (Post-Fase 4)' src --include='*.ts' --include='*.tsx' | wc -l)"
echo "Central path files: $(grep -rl 'generateWithCentralPrompt' src --include='*.ts' --include='*.tsx' | wc -l)"
echo "ContextualAskAI: $(grep -r 'ContextualAskAI' src --include='*.tsx' | wc -l)"
echo "Legacy aiService UI: $(grep -r 'from [\"'\'']\. *aiService' src --include='*.ts' --include='*.tsx' | grep -v 'ai/brain' | wc -l || echo 0)"

echo ""
echo "Metrics (if available):"
node -e '
try {
  const { AIBrain } = require("./src/ai/brain/AIBrain");
  const s = AIBrain.getUsageStats ? AIBrain.getUsageStats() : {};
  console.log("Total calls:", s.totalCentralCalls || "N/A");
  console.log("Fallback %:", s.totalCentralCalls ? ((s.fallbackUsed || 0) / s.totalCentralCalls * 100).toFixed(1) : "N/A");
} catch(e) { console.log("(run from app context for live metrics)"); }
' 2>/dev/null || echo "(live metrics require runtime)"
