#!/usr/bin/env node
/**
 * Lighthouse Audit Script — DocenteDoc AI
 * Esegue audit Lighthouse su un URL locale o remoto.
 *
 * Usage:
 *   node scripts/lighthouse-audit.js
 *   node scripts/lighthouse-audit.js --url http://localhost:5173
 *   node scripts/lighthouse-audit.js --url http://localhost:5173 --categories performance,accessibility
 */

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { launch } from 'chrome-launcher';
const { default: lighthouse } = await import('lighthouse');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'audit', 'lighthouse');

// --- CLI args ---
const args = process.argv.slice(2);
const getArg = (key) => {
  const idx = args.indexOf(key);
  return idx !== -1 ? args[idx + 1] : null;
};

const URL = getArg('--url') || 'http://localhost:5173';
const rawCategories = getArg('--categories');
const CATEGORIES = rawCategories
  ? rawCategories.split(',')
  : ['performance', 'accessibility', 'best-practices', 'seo'];

const THRESHOLDS = {
  performance: 70,
  accessibility: 90,
  'best-practices': 80,
  seo: 80,
};

async function run() {
  await mkdir(REPORT_DIR, { recursive: true });

  console.log(`\n🔍 Lighthouse Audit — ${URL}`);
  console.log(`📋 Categorie: ${CATEGORIES.join(', ')}\n`);

  const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox'] });

  const options = {
    logLevel: 'error',
    output: ['html', 'json'],
    onlyCategories: CATEGORIES,
    port: chrome.port,
  };

  let result;
  try {
    result = await lighthouse(URL, options);
  } finally {
    try { await chrome.kill(); } catch (_) { /* cleanup permission errors on Windows are harmless */ }
  }

  const { lhr, report } = result;

  // Salva report HTML
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const htmlPath = path.join(REPORT_DIR, `report-${timestamp}.html`);
  const jsonPath = path.join(REPORT_DIR, `report-${timestamp}.json`);

  await writeFile(htmlPath, report[0]);
  await writeFile(jsonPath, report[1]);

  // Stampa punteggi
  console.log('📊 Punteggi:\n');
  let failed = false;

  for (const cat of CATEGORIES) {
    const score = lhr.categories[cat]?.score;
    if (score === undefined) continue;
    const pct = Math.round(score * 100);
    const threshold = THRESHOLDS[cat] ?? 0;
    const ok = pct >= threshold;
    const icon = ok ? '✅' : '❌';
    const label = cat.padEnd(16);
    if (!ok) failed = true;
    console.log(`  ${icon} ${label} ${pct} / 100  (soglia: ${threshold})`);
  }

  console.log(`\n📁 Report salvato in:\n   ${htmlPath}\n`);

  if (failed) {
    console.error('⚠️  Alcune categorie sono sotto soglia.\n');
    process.exit(1);
  } else {
    console.log('✅ Tutti i punteggi sopra soglia.\n');
  }
}

run().catch((err) => {
  console.error('Errore Lighthouse:', err);
  process.exit(1);
});
