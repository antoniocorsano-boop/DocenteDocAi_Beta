#!/usr/bin/env tsx
/**
 * ai-usage-audit.ts
 * 
 * Lightweight audit script for Post-Fase 4 central AI path.
 * Run with: npx tsx scripts/ai-usage-audit.ts
 * 
 * Safe to run outside full app context.
 */

import { execSync } from 'child_process';
import * as path from 'path';

console.log('\n🔍 AI USAGE & INVARIANT AUDIT — Post-Fase 4');
console.log('='.repeat(55));
console.log(`Date: ${new Date().toISOString()}\n`);

// 1. Try to load usage stats (graceful fallback)
console.log('📊 CENTRAL PATH USAGE');
try {
  // Dynamic import to avoid env errors
  const { AIBrain } = require('../src/ai/brain/AIBrain');
  const usage = AIBrain.getUsageStats?.() || AIBrain.getStats?.();
  console.log(JSON.stringify(usage, null, 2));
} catch (e: any) {
  console.log('  (Usage stats require runtime context — expected outside app)');
  console.log('  Tip: Call AIBrain.getUsageStats() from a React component or dev console.');
}

// 2. Invariant Checks (static grep)
console.log('\n✅ PHASE 4 INVARIANTS');

const srcDir = path.join(process.cwd(), 'src');

// ContextualAskAI
try {
  const count = execSync(`grep -r "ContextualAskAI" ${srcDir} --include="*.tsx" | wc -l`, { encoding: 'utf8' }).trim();
  console.log(`  ContextualAskAI: ${count} (target: ~65)`);
} catch {}

// Post-Fase 4 blocks
try {
  const count = execSync(`grep -r "AIBrain (Post-Fase 4)" ${srcDir} --include="*.ts" --include="*.tsx" | wc -l`, { encoding: 'utf8' }).trim();
  console.log(`  Post-Fase 4 blocks: ${count} (target: 27)`);
} catch {}

// Central path adoption
try {
  const count = execSync(`grep -rl "generateWithCentralPrompt" ${srcDir} --include="*.ts" --include="*.tsx" | wc -l`, { encoding: 'utf8' }).trim();
  console.log(`  Files using central path: ${count}`);
} catch {}

// Legacy aiService (must be 0 outside brain)
try {
  const count = execSync(`grep -r "from ['\"].*aiService['\"]" ${srcDir} --include="*.ts" --include="*.tsx" | grep -v "ai/brain" | wc -l`, { encoding: 'utf8' }).trim();
  console.log(`  Legacy aiService imports in UI: ${count} (target: 0)`);
} catch {}

// 3. TSC
console.log('\n🧪 TYPE CHECK');
try {
  const errors = execSync(
    `NODE_OPTIONS="--max-old-space-size=4096" ./node_modules/.bin/tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"`,
    { encoding: 'utf8' }
  ).trim();
  console.log(`  TSC errors: ${errors} (must be exactly 3 pre-existing TS1136)`);
} catch {
  console.log('  TSC: could not run');
}

// 4. Duplication check
console.log('\n🧹 DUPLICATION CHECK');
const keyMethods = [
  'analyzeCircularDocument', 'generateSituazionePartenza', 'generateClassPlanningDocument',
  'extractEventFromText', 'generateAnswerFromCorpus', 'getProactiveSuggestions',
  'parseCurriculumFromText', 'refactorProgrammazione', 'generateCompetencyNote', 'generateThemeFromPrompt'
];
let dupFound = 0;
keyMethods.forEach(m => {
  try {
    const countStr = execSync(`grep -c "async ${m}" src/ai/brain/AIBrain.ts`, { encoding: 'utf8' }).trim();
    const count = parseInt(countStr);
    if (count > 1) {
      console.log(`  ⚠️  ${m}: ${count} (should be 1)`);
      dupFound++;
    }
  } catch {}
});
console.log(`  Duplicated key methods: ${dupFound} (target: 0)`);

console.log('\n' + '='.repeat(55));
console.log('✅ Audit complete. Run this periodically during soak.');
console.log('For live metrics: import { AIBrain } from "@/ai/brain/AIBrain"; console.log(AIBrain.getUsageStats());\n');