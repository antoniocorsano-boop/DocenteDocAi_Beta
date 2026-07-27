const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const url = process.env.URL || 'https://docentedoc-ai.vercel.app';
  const outDir = path.resolve(__dirname, '..', 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'prod-console-logs.json');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = { url, capturedAt: new Date().toISOString(), console: [], pageErrors: [], responses: [] };

  page.on('console', msg => {
    try {
      const args = msg.args();
      const values = args.map(a => a._remoteObject?.value).slice();
      logs.console.push({ type: msg.type(), text: msg.text(), values, location: msg.location() });
    } catch (e) {
      logs.console.push({ type: msg.type(), text: msg.text(), error: String(e) });
    }
  });

  page.on('pageerror', err => {
    logs.pageErrors.push({ message: err.message, stack: err.stack });
  });

  page.on('response', async response => {
    try {
      const status = response.status();
      const url = response.url();
      if (status >= 400) logs.responses.push({ url, status });
    } catch (e) {
      // ignore
    }
  });

  console.log(`[playwright] opening ${url}`);
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    logs.mainResponse = { status: resp ? resp.status() : null, url: resp ? resp.url() : null };
  } catch (e) {
    logs.gotoError = String(e);
  }

  // wait a bit for dynamic errors
  await page.waitForTimeout(10000);

  // take a screenshot for context
  const shotPath = path.join(outDir, 'prod-page-screenshot.png');
  try { await page.screenshot({ path: shotPath, fullPage: true }); logs.screenshot = shotPath; } catch (e) { logs.screenshotError = String(e); }

  await browser.close();

  fs.writeFileSync(outFile, JSON.stringify(logs, null, 2));
  console.log(`[playwright] logs saved to ${outFile}`);
  if (logs.pageErrors.length) console.log('[playwright] page errors:', logs.pageErrors);
  if (logs.console.length) console.log('[playwright] console messages (first 10):', logs.console.slice(0,10));

  // exit non-zero if there were page errors
  process.exit(logs.pageErrors.length || logs.responses.length ? 1 : 0);
})();
