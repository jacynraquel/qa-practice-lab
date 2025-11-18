import addContext from 'mochawesome/addContext.js';
import path from 'node:path';
import fs from 'node:fs/promises';


import 'dotenv/config';
import { chromium } from 'playwright';
import { expect } from 'chai';

const BASE_URL = process.env.BASE_URL;
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;

const sel = {
  email: '#Input_Email, input[name="Email"], input[type="email"]',
  password: '#Input_Password, input[name="Password"], input[type="password"]',
  submit: '#login-submit, button[type="submit"], input[type="submit"]',
  error: '.field-validation-error, [data-test-id="login-error"], .text-danger, .alert-danger'
};

describe('Escochex Login Page', function () {
  let browser, context, page;
  this.timeout(180000);

  before(async () => {

    browser = await chromium.launch({ headless: false });

    context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 800 }
    });

    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

    // (Optional) block fonts/images to speed up
    // await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2}', r => r.abort());

    page = await context.newPage();

    page.on('console', m => { if (m.type() === 'error') console.error('[PAGE ERROR]', m.text()); });
    page.on('requestfailed', req => {
      const f = req.failure();
      if (f?.errorText !== 'net::ERR_ABORTED') {
        console.error('[REQ FAILED]', req.url(), f?.errorText);
      }
    });
  });

  after(async () => {
    await context.close();
    await browser.close();
  });

  it('should load the login page', async () => {
    const resp = await page.goto(`${BASE_URL}/Account/Login?Role=1`, { timeout: 60000 });
    expect(resp?.status()).to.be.oneOf([200, 304]);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector(sel.email, { timeout: 15000 });
    const title = (await page.title()).toLowerCase();
    expect(title).to.include('login'); // case-insensitive
  });

  it('should show error for invalid credentials', async () => {
    await page.goto(`${BASE_URL}/Account/Login?Role=1`, { timeout: 60000 });
    await page.waitForSelector(sel.email, { timeout: 15000 });
    await page.fill(sel.email, 'wrong@email.com');
    await page.fill(sel.password, 'wrongpassword');

    const nav = page.waitForNavigation({ timeout: 15000 }).catch(() => null);
    const click = page.locator(sel.submit).first();
    if (await click.count()) {
      await Promise.allSettled([nav, click.click()]);
    } else {
      await Promise.allSettled([nav, page.press(sel.password, 'Enter')]);
    }

  // Wait for error message by text
    await page.waitForSelector('text=/invalid/i', { timeout: 15000 });
    const errorText = await page.textContent('text=/invalid/i');
    expect(errorText.toLowerCase()).to.include('invalid');
  });


  it('should login successfully with valid credentials', async () => {
    await page.goto(`${BASE_URL}/Account/Login?Role=1`, { timeout: 60000 });
    await page.waitForSelector(sel.email, { timeout: 15000 });
    await page.fill(sel.email, USER_EMAIL);
    await page.fill(sel.password, USER_PASSWORD);

    const nav = page.waitForNavigation({
      url: url => /dashboard|home|^https?:\/\/[^/]+\/?$/.test(url.toLowerCase()),
      timeout: 45000
    }).catch(() => null);

    const submit = page.locator(sel.submit).first();
    if (await submit.count()) {
      await Promise.allSettled([nav, submit.click()]);
    } else {
      await Promise.allSettled([nav, page.press(sel.password, 'Enter')]);
    }

    const url = page.url().toLowerCase();
    expect(url).to.not.match(/account\/login/);
  });

  afterEach(async function () {
  // Run only if the current test failed
    const failed = this.currentTest && this.currentTest.state === 'failed';
    if (!failed) return;

    try {
    // --- Ensure screenshot folder exists ---
      const dir = path.join('mochawesome-report', 'screenshots');
      await fs.mkdir(dir, { recursive: true });

    // --- Sanitize the test name for a file-safe name ---
      const safeName = this.currentTest.title.replace(/[^\w\d-_]+/g, '_');

    // --- Take screenshot ---
      const screenshotPath = path.join(dir, `${safeName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

    // --- Stop and save Playwright trace ---
      const tracePath = path.join('mochawesome-report', `${safeName}.trace.zip`);
      await context.tracing.stop({ path: tracePath });

    // --- Attach both to Mochawesome report ---
      addContext(this, { title: 'Screenshot', value: path.join('screenshots', `${safeName}.png`) });
      addContext(this, { title: 'Playwright Trace', value: `${safeName}.trace.zip` });

    // Restart tracing for the next test
      await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    } catch (err) {
      console.error('Failed to capture screenshot or trace:', err.message);
    }
  });

});
