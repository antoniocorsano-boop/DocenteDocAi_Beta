import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:5173/';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[pageerror]', err && err.stack ? err.stack : err));
  try {
    await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);
    // Try fill common sign-in inputs
    if ((await page.locator('input[placeholder="Nome Docente"]').count()) > 0) {
      await page.fill('input[placeholder="Nome Docente"]', 'Test Teacher');
      await page.click('text=Entra in Locale').catch(()=>{});
    } else if ((await page.locator('input[placeholder="Es. Prof. Rossi"]').count()) > 0) {
      // Could be WelcomeScreen
      await page.click('text=Accesso Rapido').catch(()=>{});
      await page.fill('input[placeholder="Es. Prof. Rossi"]', 'Test Teacher');
      await page.click('button:has-text("Entra nella Dashboard")').catch(()=>{});
    } else {
      console.log('No known sign-in input found');
    }
    await page.waitForTimeout(2000);
    const html = await page.content();
    console.log('---- HTML snapshot ----');
    console.log(html.slice(0, 8000));
  } catch(e){ console.log('err', e); }
  await browser.close();
})();