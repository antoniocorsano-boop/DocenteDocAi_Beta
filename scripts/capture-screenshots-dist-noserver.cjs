const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

const SCREENS = [
  { path: 'dashboard-dist.png', route: '/' },
  { path: 'registro-dist.png', route: '/register' },
  { path: 'studenti-dist.png', route: '/studenti' },
  { path: 'lezioni-dist.png', route: '/lezioni' },
  { path: 'analytics-dist.png', route: '/analytics' },
  { path: 'impostazioni-dist.png', route: '/settings' },
];

function waitForUrl(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      const req = http.get(url, res => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) return reject(new Error('Timeout waiting for ' + url));
        setTimeout(poll, 500);
      });
    })();
  });
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  try {
    console.log('Waiting for', BASE_URL);
    await waitForUrl(BASE_URL, 30000);

    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

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

    await browser.close();
    console.log('Done.');
  } catch (err) {
    console.error('Error during capture', err);
    process.exitCode = 1;
  }
})();
