// tests/hooks/globalHooks.js
import addContext from 'mochawesome/addContext.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

let browser;
let context;
let page;

export function getPage() {
  return page;
}

export function getContext() {
  return context;
}

// Root hooks for Mocha (ESM-friendly)
export const mochaHooks = {
  // Runs once before ALL test files
  async beforeAll() {
    this.timeout?.(180000); // in case Mocha provides this

    browser = await chromium.launch({ headless: false });

    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 800 }
    });

    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true
    });

    page = await context.newPage();

    // Logging
    page.on('console', m => {
      if (m.type() === 'error') console.error('[PAGE ERROR]', m.text());
    });

    page.on('requestfailed', req => {
      const f = req.failure();
      if (f?.errorText !== 'net::ERR_ABORTED') {
        console.error('[REQ FAILED]', req.url(), f?.errorText);
      }
    });
  },

  // Runs once after ALL test files
  async afterAll() {
    if (context) await context.close();
    if (browser) await browser.close();
  },

  // Runs after EACH test
  async afterEach() {
    const failed = this.currentTest && this.currentTest.state === 'failed';
    if (!failed) return;

    try {
      const dir = path.join('mochawesome-report', 'screenshots');
      await fs.mkdir(dir, { recursive: true });

      const safeName = this.currentTest.title.replace(/[^\w\d-_]+/g, '_');

      const screenshotPath = path.join(dir, `${safeName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const tracePath = path.join('mochawesome-report', `${safeName}.trace.zip`);
      await context.tracing.stop({ path: tracePath });

      addContext(this, {
        title: 'Screenshot',
        value: path.join('screenshots', `${safeName}.png`)
      });

      addContext(this, {
        title: 'Playwright Trace',
        value: `${safeName}.trace.zip`
      });

      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true
      });
    } catch (err) {
      console.error('Failed to capture screenshot or trace:', err.message);
    }
  }
};
