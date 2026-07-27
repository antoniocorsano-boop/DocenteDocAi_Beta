// @ts-nocheck
/**
 * DocenteDoc AI - Presentation Video Screenshots
 *
 * Automated screenshot capture for creating presentation videos
 * of the DocenteDoc AI application features.
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('DocenteDoc AI - Presentation Screenshots', () => {
  let devServer: any;

  test.beforeAll(async () => {
    // Start dev server
    console.log('🚀 Starting development server...');
    devServer = execSync('npm run dev', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'pipe',
      detached: true
    });
  });

  test.afterAll(async () => {
    // Stop dev server
    if (devServer) {
      try {
        process.kill(-devServer.pid);
      } catch (e) {
        console.log('Dev server already stopped');
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for presentation
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to the application
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Wait for the app to load
    await page.waitForSelector('[data-testid="home-container"], .home-container, main', { timeout: 10000 });
  });

  test('01 - Landing Page - Hero Section', async ({ page }) => {
    console.log('📸 Capturing: Landing Page - Hero Section');

    // Wait for hero section to load
    await page.waitForSelector('[data-testid="hero-section"], .hero-section, h1', { timeout: 5000 });

    // Capture full page screenshot
    await page.screenshot({
      path: 'presentation-screenshots/01-landing-hero.png',
      fullPage: true
    });

    console.log('✅ Captured: 01-landing-hero.png');
  });

  test('02 - Landing Page - Quick Actions', async ({ page }) => {
    console.log('📸 Capturing: Landing Page - Quick Actions');

    // Wait for quick actions to load
    await page.waitForSelector('[data-testid="quick-actions"], .quick-actions, button', { timeout: 5000 });

    // Scroll to quick actions section if needed
    await page.locator('[data-testid="quick-actions"], .quick-actions').first().scrollIntoViewIfNeeded();

    // Small delay for visual stability
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'presentation-screenshots/02-quick-actions.png',
      fullPage: false
    });

    console.log('✅ Captured: 02-quick-actions.png');
  });

  test('03 - AI Suggestions - Active Suggestion', async ({ page }) => {
    console.log('📸 Capturing: AI Suggestions');

    // Check if AI suggestion is visible
    const suggestionVisible = await page.locator('[data-testid="ai-suggestion"], .ai-suggestion').isVisible();

    if (suggestionVisible) {
      await page.locator('[data-testid="ai-suggestion"], .ai-suggestion').first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'presentation-screenshots/03-ai-suggestion.png',
        fullPage: false
      });

      console.log('✅ Captured: 03-ai-suggestion.png');
    } else {
      console.log('⚠️  AI Suggestion not visible, capturing empty state');

      // Capture the area where suggestions would appear
      await page.screenshot({
        path: 'presentation-screenshots/03-ai-suggestion-empty.png',
        fullPage: false
      });

      console.log('✅ Captured: 03-ai-suggestion-empty.png');
    }
  });

  test('04 - Next Lesson Section', async ({ page }) => {
    console.log('📸 Capturing: Next Lesson Section');

    // Wait for next lesson section
    await page.waitForSelector('[data-testid="next-lesson"], .next-lesson, .lesson-card', { timeout: 5000 });

    await page.locator('[data-testid="next-lesson"], .next-lesson, .lesson-card').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'presentation-screenshots/04-next-lesson.png',
      fullPage: false
    });

    console.log('✅ Captured: 04-next-lesson.png');
  });

  test('05 - Navigation to Appello (Attendance)', async ({ page }) => {
    console.log('📸 Capturing: Navigation to Appello');

    // Click on Appello button
    await page.locator('[data-testid="action-appello"], button:has-text("Appello")').first().click();

    // Wait for navigation
    await page.waitForURL('**/aula', { timeout: 5000 });

    // Wait for classroom view to load
    await page.waitForSelector('[data-testid="classroom-view"], .classroom-view, .attendance', { timeout: 5000 });

    await page.screenshot({
      path: 'presentation-screenshots/05-appello-view.png',
      fullPage: true
    });

    console.log('✅ Captured: 05-appello-view.png');
  });

  test('06 - Navigation to Valutazioni (Evaluations)', async ({ page }) => {
    console.log('📸 Capturing: Navigation to Valutazioni');

    // Go back to home first
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="home-container"], .home-container', { timeout: 5000 });

    // Click on Valutazioni button
    await page.locator('[data-testid="action-valutazioni"], button:has-text("Valutazioni")').first().click();

    // Wait for navigation
    await page.waitForURL('**/evaluations', { timeout: 5000 });

    // Wait for evaluations view to load
    await page.waitForSelector('[data-testid="evaluations-view"], .evaluations-view, .evaluation-module', { timeout: 5000 });

    await page.screenshot({
      path: 'presentation-screenshots/06-valutazioni-view.png',
      fullPage: true
    });

    console.log('✅ Captured: 06-valutazioni-view.png');
  });

  test('07 - Navigation to Progettazione (Planning)', async ({ page }) => {
    console.log('📸 Capturing: Navigation to Progettazione');

    // Go back to home first
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="home-container"], .home-container', { timeout: 5000 });

    // Click on Progettazione button
    await page.locator('[data-testid="action-progettazione"], button:has-text("Progettazione")').first().click();

    // Wait for navigation
    await page.waitForURL('**/progettazione-hub', { timeout: 5000 });

    // Wait for planning hub to load
    await page.waitForSelector('[data-testid="progettazione-hub"], .progettazione-hub, .planning', { timeout: 5000 });

    await page.screenshot({
      path: 'presentation-screenshots/07-progettazione-view.png',
      fullPage: true
    });

    console.log('✅ Captured: 07-progettazione-view.png');
  });

  test('08 - Settings Panel', async ({ page }) => {
    console.log('📸 Capturing: Settings Panel');

    // Go back to home first
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="home-container"], .home-container', { timeout: 5000 });

    // Look for settings navigation (might be in a menu or header)
    const settingsButton = page.locator('[data-testid="settings-button"], button:has-text("Impostazioni"), [href*="settings"]');

    if (await settingsButton.isVisible()) {
      await settingsButton.first().click();

      // Wait for navigation
      await page.waitForURL('**/settings', { timeout: 5000 });

      // Wait for settings to load
      await page.waitForSelector('[data-testid="settings-panel"], .settings-panel, form', { timeout: 5000 });

      await page.screenshot({
        path: 'presentation-screenshots/08-settings-panel.png',
        fullPage: true
      });

      console.log('✅ Captured: 08-settings-panel.png');
    } else {
      console.log('⚠️  Settings button not found, capturing current view');
      await page.screenshot({
        path: 'presentation-screenshots/08-current-view.png',
        fullPage: true
      });
    }
  });

  test('09 - Mobile Responsive View', async ({ page }) => {
    console.log('📸 Capturing: Mobile Responsive View');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page for mobile layout
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="home-container"], .home-container', { timeout: 5000 });

    await page.screenshot({
      path: 'presentation-screenshots/09-mobile-view.png',
      fullPage: true
    });

    console.log('✅ Captured: 09-mobile-view.png');
  });

  test('10 - Scrolling Demonstration', async ({ page }) => {
    console.log('📸 Capturing: Scrolling Demonstration');

    // Reset to desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload({ waitUntil: 'networkidle' });

    // Wait for content to load
    await page.waitForSelector('[data-testid="home-container"], .home-container', { timeout: 5000 });

    // Scroll to bottom to demonstrate scrolling functionality
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(1000); // Wait for smooth scroll

    await page.screenshot({
      path: 'presentation-screenshots/10-scroll-demonstration.png',
      fullPage: true
    });

    console.log('✅ Captured: 10-scroll-demonstration.png');
  });
});
