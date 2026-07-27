const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const url = process.argv[2] || 'https://docentedoc-ai.vercel.app';
  const outDir = 'test-results/prod-diagnostic';
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const logs = [];

  page.on('console', msg => logs.push({ kind: 'console', type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ kind: 'pageerror', message: err.message, stack: err.stack }));
  page.on('requestfailed', req => logs.push({ kind: 'requestfailed', url: req.url(), failure: req.failure() ? req.failure().errorText : null }));

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  } catch (e) {
    logs.push({ kind: 'gotoError', message: e.message });
  }

  try {
    await page.screenshot({ path: `${outDir}/screenshot.png`, fullPage: true });
  } catch (e) {
    logs.push({ kind: 'screenshotError', message: e.message });
  }

  fs.writeFileSync(`${outDir}/console.json`, JSON.stringify(logs, null, 2));
  console.log('Diagnostic saved to', outDir);
  await browser.close();
  const extErrors = logs.filter(l => (l.stack && l.stack.includes('chrome-extension://')) || (l.message && l.message.includes('chrome-extension://')));
  if (extErrors.length) console.log('FOUND_EXTENSION_ERRORS:', extErrors.length);
  process.exit(0);
})();
