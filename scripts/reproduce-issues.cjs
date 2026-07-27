const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const START = process.env.START_URL || 'http://localhost:8080';
const OUT = path.join(__dirname, '..', 'docs', 'repro');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const pagesToTest = [
  { route: '/orario', name: 'orario' },
  { route: '/timeline', name: 'timeline' },
  { route: '/', name: 'home' },
];

const selectors = {
  timetableCell: ['.timetable-cell', '.orario-cell', 'td[data-slot]', 'td.slot', '.slot-cell', 'table td'],
  todayLine: ['.today-line', '.timeline .today', '.timeline-today', '[data-today]'],
  assistantFab: ['button[aria-label="Assistant"]', '.assistant-fab', '.m3-fab', '#assistant', 'button[data-assistant]'],
  fulmineTrigger: ['.fulmine', '[data-menu="fulmine"]', 'button[aria-label="Fulmine"]', '#fulmine'],
  studioAiTrigger: ['[data-feature="studio-ai"]', 'button[aria-label="Studio AI"]', 'a:has-text("Studio AI")', 'button:has-text("Studio AI")']
};

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await context.newPage();

  const report = { startedAt: new Date().toISOString(), results: {} };

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('PAGE_CONSOLE_ERROR', msg.text());
  });
  page.on('pageerror', err => console.error('PAGE_ERROR', err.message));
  page.on('requestfailed', req => console.error('REQUEST_FAILED', req.url(), req.failure() && req.failure().errorText));

  for (const p of pagesToTest) {
    const url = new URL(p.route, START).toString();
    const name = p.name;
    report.results[name] = { url, actions: [] };
    try {
      console.log('Visiting', url);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(500);
      const shot = path.join(OUT, `${name}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      report.results[name].screenshot = shot;

      // Try clicking a timetable cell
      for (const s of selectors.timetableCell) {
        const el = await page.$(s);
        if (el) {
          try {
            await el.scrollIntoViewIfNeeded();
            await page.waitForTimeout(200);
            await el.click({ timeout: 2000 }).catch(e => {});
            await page.waitForTimeout(400);
            const after = path.join(OUT, `${name}_clicked_timetable.png`);
            await page.screenshot({ path: after, fullPage: true });
            report.results[name].actions.push({ action: 'click_timetable', selector: s, screenshot: after });
            break;
          } catch (e) {
            report.results[name].actions.push({ action: 'click_timetable_failed', selector: s, error: e.message });
          }
        }
      }

      // Check timeline today line
      for (const s of selectors.todayLine) {
        const el = await page.$(s);
        if (el) {
          const bbox = await el.boundingBox();
          report.results[name].actions.push({ action: 'found_today_line', selector: s, bbox });
          break;
        }
      }

      // Check assistant FAB
      let fabFound = false;
      for (const s of selectors.assistantFab) {
        const el = await page.$(s);
        if (el) {
          fabFound = true;
          const bbox = await el.boundingBox();
          report.results[name].actions.push({ action: 'fab_found', selector: s, bbox });
          // attempt to make it draggable reposition (if supported)
          try {
            await el.hover();
            await page.mouse.down();
            await page.mouse.move(bbox.x + 10, bbox.y + 10);
            await page.mouse.up();
            await page.waitForTimeout(300);
            const fabAfter = path.join(OUT, `${name}_fab_after.png`);
            await page.screenshot({ path: fabAfter, fullPage: true });
            report.results[name].actions.push({ action: 'fab_drag_attempt', screenshot: fabAfter });
          } catch (e) {
            report.results[name].actions.push({ action: 'fab_drag_failed', error: e.message });
          }
          break;
        }
      }
      if (!fabFound) report.results[name].actions.push({ action: 'fab_not_found' });

      // Open Fulmine menu
      for (const s of selectors.fulmineTrigger) {
        const el = await page.$(s);
        if (el) {
          try {
            await el.click();
            await page.waitForTimeout(500);
            const modal = await page.$('.modal, [role="dialog"], .m3-dialog');
            const modalShot = path.join(OUT, `${name}_fulmine_modal.png`);
            await page.screenshot({ path: modalShot, fullPage: true });
            report.results[name].actions.push({ action: 'fulmine_clicked', selector: s, modal: !!modal, screenshot: modalShot });
          } catch (e) {
            report.results[name].actions.push({ action: 'fulmine_click_failed', selector: s, error: e.message });
          }
          break;
        }
      }

      // Try Studio AI trigger
      for (const s of selectors.studioAiTrigger) {
        const el = await page.$(s);
        if (el) {
          try {
            await el.click();
            await page.waitForTimeout(800);
            const modal = await page.$('.modal, [role="dialog"], .m3-dialog');
            const shotAi = path.join(OUT, `${name}_studioai.png`);
            await page.screenshot({ path: shotAi, fullPage: true });
            report.results[name].actions.push({ action: 'studioai_clicked', selector: s, modal: !!modal, screenshot: shotAi });
          } catch (e) {
            report.results[name].actions.push({ action: 'studioai_click_failed', selector: s, error: e.message });
          }
          break;
        }
      }

    } catch (e) {
      console.error('Error testing', name, e.message);
      report.results[name].error = e.message;
    }
  }

  // save report
  const outPath = path.join(OUT, 'repro-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log('Repro report saved to', outPath);

  await browser.close();
})();
