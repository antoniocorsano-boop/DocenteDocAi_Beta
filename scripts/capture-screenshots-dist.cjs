const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
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

async function startStaticServer() {
  return new Promise((resolve, reject) => {
    const nodeExec = process.execPath;
    const server = spawn(nodeExec, ['scripts/static-server.cjs'], { stdio: 'ignore' });
    server.on('error', err => reject(err));
    waitForUrl(BASE_URL).then(() => resolve(server)).catch(err => reject(err));
  });
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let serverProcess = null;
  try {
    console.log('Starting static server (npx http-server dist -p 8080)');
    serverProcess = await startStaticServer();
    console.log('Static server running at', BASE_URL);

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
  } finally {
    if (serverProcess) {
      try {
        serverProcess.kill();
        console.log('Static server stopped.');
      } catch (e) {
        // ignore
      }
    }
  }
}

run().catch(err => { console.error(err); process.exit(1); });
