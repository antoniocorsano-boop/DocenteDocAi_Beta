#!/usr/bin/env node
import { chromium } from 'playwright';
import fs from 'fs';
import process from 'process';

const out = { consoleLogs: [], pageErrors: [], sw: null };
try {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    out.consoleLogs.push({ type: msg.type(), text: msg.text() });
    globalThis.console.log('[console]', msg.type(), msg.text());
  });
  page.on('pageerror', err => {
    out.pageErrors.push(String(err));
    globalThis.console.error('[pageerror]', String(err));
  });

  // Try multiple possible dev server addresses (127.0.0.1, localhost, LAN IP) to handle binding differences
  // Probe common dev ports (8080/8081/8090) on loopback and LAN IPs
  const urls = [
    'http://127.0.0.1:8080/', 'http://localhost:8080/', 'http://192.168.1.46:8080/',
    'http://[::1]:8081/', 'http://127.0.0.1:8081/', 'http://localhost:8081/', 'http://192.168.1.46:8081/',
    'http://127.0.0.1:8090/', 'http://localhost:8090/', 'http://192.168.1.46:8090/'
  ];
  let url = null;
  for (const u of urls) {
    try {
      globalThis.console.log('Probing', u);
      await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 3000 });
      url = u;
      break;
    } catch (e) {
      globalThis.console.error('Probe failed for', u, e.message);
    }
  }
  if (!url) {
    url = urls[0];
    globalThis.console.error('No address reachable; proceeding with', url);
  }
  globalThis.console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => {
    globalThis.console.error('goto failed', e.message);
  });

  // Try to access service worker registrations and unregister them
  try {
    const registrations = await page.evaluate(async () => {
       
      if (!('serviceWorker' in navigator)) return null;
      const regs = await navigator.serviceWorker.getRegistrations();
      const list = regs.map(r => ({ scope: r.scope, active: !!r.active }));
      await Promise.all(regs.map(r => r.unregister()));
      return list;
       
    });
    out.sw = registrations;
    globalThis.console.log('Service worker registrations (unregistered):', registrations);
  } catch (err) {
    globalThis.console.error('SW unregister failed:', err);
  }

  // Force reload and wait
  await page.reload({ waitUntil: 'networkidle', timeout: 15000 }).catch(e => globalThis.console.error('reload failed', e.message));

  // capture screenshot and page content
  await fs.promises.mkdir('tmp', { recursive: true });
  await page.screenshot({ path: 'tmp/unregister-screenshot.png', fullPage: true });
  const html = await page.content();
  fs.writeFileSync('tmp/unregister-page.html', html);
  fs.writeFileSync('tmp/unregister-log.json', JSON.stringify(out, null, 2));

  await browser.close();
  console.log('Done, logs/screenshot saved to tmp/');
} catch (err) {
  globalThis.console.error('Script error', err);
  try { fs.writeFileSync('tmp/unregister-log.json', JSON.stringify(out, null, 2)); } catch(e){ /* ignore */ }
  process.exitCode = 1;
}
