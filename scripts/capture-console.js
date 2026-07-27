import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.message);
    console.error(err.stack);
  });
  const url = process.argv[2] || process.env.URL || 'http://localhost:8081/';
  console.log('Visiting', url);
  let tries = 0;
  while (tries < 8) {
    try {
      await page.goto(url, { waitUntil: 'load' });
      break;
    } catch (e) {
      console.log('goto failed, retrying...', e.message || e);
      tries++;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  if (tries === 8) {
    console.error('Unable to reach', url);
    await browser.close();
    process.exit(1);
  }

  // wait to allow error to appear and async initializers
  await page.waitForTimeout(8000);
  await browser.close();
})();