import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://localhost:5173/';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    try { console.log(`[console][${msg.type()}] ${msg.text()}`); } catch (e) {}
  });
  page.on('pageerror', err => console.log('[pageerror]', err && err.stack ? err.stack : err));

  try {
    console.log('navigating to', URL);
    await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
  } catch (e) {
    console.log('goto error:', e.message || e);
  }

  try {
    await page.waitForTimeout(2000);
    const html = await page.content();
    console.log('--- HTML SNIPPET (first 2000 chars) ---');
    console.log(html.slice(0, 2000));
  } catch (e) {
    console.log('content error', e);
  }

  await browser.close();
})();
