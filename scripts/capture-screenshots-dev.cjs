const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

const SCREENS = [
  { path: 'dashboard.png', route: '/' },
  { path: 'registro.png', route: '/register' },
  { path: 'studenti.png', route: '/studenti' },
  { path: 'lezioni.png', route: '/lezioni' },
  { path: 'analytics.png', route: '/analytics' },
  { path: 'impostazioni.png', route: '/settings' },
];

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('Using base URL:', BASE_URL);
    for (const s of SCREENS) {
      const url = new URL(s.route, BASE_URL).toString();
      console.log('Visiting', url);
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(600);
        const outPath = path.join(OUT_DIR, s.path);
        await page.screenshot({ path: outPath, fullPage: true });
        console.log('Saved', outPath);
      } catch (err) {
        console.error('Failed to capture', url, err.message || err);
      }
    }
    console.log('Done.');
  } catch (err) {
    console.error('Error during capture', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
