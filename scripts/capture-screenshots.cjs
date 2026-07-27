const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

// small built-in static server; avoids external `npx http-server` dependency

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

const SCREENS = [
  { path: 'dashboard.png', route: '/' },
  { path: 'registro.png', route: '/register' },
  { path: 'studenti.png', route: '/studenti' },
  { path: 'lezioni.png', route: '/lezioni' },
  { path: 'analytics.png', route: '/analytics' },
  { path: 'impostazioni.png', route: '/settings' },
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
    const distRoot = path.join(__dirname, '..', 'dist');
    const server = http.createServer((req, res) => {
      try {
        const parsed = url.parse(req.url).pathname || '/';
        let safePath = path.normalize(decodeURIComponent(parsed)).replace(/^\.+/, '');
        let filePath = path.join(distRoot, safePath);
        if (safePath.endsWith('/')) filePath = path.join(filePath, 'index.html');
        fs.stat(filePath, (err, stats) => {
          if (err || !stats.isFile()) {
            // fallback to index.html for SPA routes
            const index = path.join(distRoot, 'index.html');
            fs.readFile(index, (ie, data) => {
              if (ie) {
                res.statusCode = 404; res.end('Not found');
                return;
              }
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(data);
            });
            return;
          }
          const ext = path.extname(filePath).toLowerCase();
          const map = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff2': 'font/woff2'
          };
          res.setHeader('Content-Type', map[ext] || 'application/octet-stream');
          const stream = fs.createReadStream(filePath);
          stream.pipe(res);
        });
      } catch (e) {
        res.statusCode = 500; res.end('Server error');
      }
    });
    server.on('error', reject);
    server.listen(8080, () => {
      waitForUrl(BASE_URL).then(() => resolve(server)).catch(reject);
    });
  });
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let serverProcess = null;
  try {
    console.log('Starting embedded static server (serving dist on :8080)');
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
        serverProcess.close();
        console.log('Static server stopped.');
      } catch (e) {
        // ignore
      }
    }
  }
}

run().catch(err => { console.error(err); process.exit(1); });
