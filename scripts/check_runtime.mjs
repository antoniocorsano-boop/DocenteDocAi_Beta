import { chromium } from 'playwright';
import fs from 'fs';

const out = { console: [], pageErrors: [], responses: [] };
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', msg => {
  const entry = { type: msg.type(), text: msg.text() };
  out.console.push(entry);
  console.log('[console]', entry.type, entry.text);
});

page.on('pageerror', err => {
  out.pageErrors.push(String(err));
  console.error('[pageerror]', String(err));
});

page.on('response', r => {
  if (r.status() >= 400) {
    out.responses.push({ url: r.url(), status: r.status() });
    console.warn('[response]', r.status(), r.url());
  }
});

try {
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 20000 });
  await page.screenshot({ path: 'tmp/runtime-screenshot.png', fullPage: true });
  const html = await page.content();
  fs.writeFileSync('tmp/runtime-page.html', html);

  console.log('\n--- SUMMARY ---');
  console.log('Console messages:', out.console.length);
  console.log('Page errors:', out.pageErrors.length);
  console.log('Responses >= 400:', out.responses.length);

  if (out.pageErrors.length) process.exitCode = 2;
} catch (err) {
  console.error('[script error]', err);
  process.exitCode = 3;
} finally {
  await browser.close();
  fs.writeFileSync('tmp/runtime-log.json', JSON.stringify(out, null, 2));
}
