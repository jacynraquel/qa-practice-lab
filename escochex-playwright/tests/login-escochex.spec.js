// tests/login-escochex.spec.js
const { test, expect } = require('@playwright/test');
// const { getOtpFromGmailForProject } = require('../helpers/otpHelperGmail');
const { loginWithOtpYopmail } = require('../helpers/loginWithOtpYopmail');
require('dotenv').config();

test.describe('Escochex Login & Dashboard with Gmail 2FA', () => {
  test('should login and show Dashboard', async ({ page }, testInfo) => {
    const projectName = testInfo.project.name.toUpperCase(); // CHROMIUM, FIREFOX, WEBKIT

    // Pull credentials for this browser
    const TEST_EMAIL  = process.env[`TEST_EMAIL_${projectName}`];
    const TEST_PASS   = process.env[`TEST_PASS_${projectName}`];

    if (!TEST_EMAIL || !TEST_PASS) {
      throw new Error(
        `Missing YOPMAIL_INBOX_${projectName} or TEST_PASS_${projectName} in .env`
      );
    }

    console.log(`Running login test for ${projectName}`);
    console.log(`Using account: ${TEST_EMAIL}`);

    // --- Start Login ---
    await page.goto(process.env.BASE_URL);
    console.log("BASE_URL=", process.env.BASE_URL);

    await page.getByText('Sign In', { exact: true }).click();
    await page.getByText('Super Admin', { exact: true }).click();

    await page.getByPlaceholder('Email').fill(TEST_EMAIL);
    await page.getByPlaceholder('Password').fill(TEST_PASS);
    await page.getByRole('button', { name: /login/i }).click();

     // --- Try to detect OTP step, but treat its absence as OK ---
    const otpInput = page.locator('#TwoFactorOtp');

    let requires2FA = false;

    try {
      // If this finds the OTP input within 10s, we consider 2FA required
      await otpInput.waitFor({ timeout: 10000 });
      requires2FA = true;
      console.log(`2FA screen detected for ${projectName}`);
    } catch {
      // If it times out, assume user/device is still trusted and no OTP needed
      console.log(`No 2FA screen for ${projectName} – proceeding without OTP`);
    }

    if (requires2FA) {
      console.log(`Fetching Yopmail OTP for ${projectName}...`);

      const otp = await loginWithOtpYopmail(projectName);
      console.log(`OTP received: ${otp}`);

      await otpInput.fill(otp);
      await page.getByRole('button', { name: /verify|submit|continue/i }).click();
    }

     // --- Final check: we should land on the Dashboard either way ---
    await expect(page).toHaveTitle(/Dashboard/i);

    console.log(`Login success & dashboard loaded for ${projectName}!`);
  });
});
