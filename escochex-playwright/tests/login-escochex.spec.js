const { test, expect } = require('@playwright/test');
const { getOtpFromGmailForProject } = require('../helpers/otpHelperGmail');
// const { loginWithOtpYopmail } = require('../helpers/loginWithOtpYopmail');
require('dotenv').config();

test.describe('Escochex Login & Dashboard with 2FA (Yopmail)', () => {
  test('should login and show Dashboard', async ({ page }, testInfo) => {
    test.setTimeout(90000); // 90 seconds
    const projectName = testInfo.project.name.toUpperCase(); // CHROMIUM, FIREFOX, WEBKIT

    const TEST_EMAIL = process.env[`TEST_EMAIL_${projectName}`];
    const TEST_PASS = process.env[`TEST_PASS_${projectName}`];
    const YOPMAIL_INBOX = process.env[`YOPMAIL_INBOX_${projectName}`];

    // --- login steps ---
    await page.goto(process.env.BASE_URL);

    await page.getByText('Sign In', {exact: true}).click();
    await page.getByText('Super Admin', { exact: true }).click();

    await page.getByPlaceholder('Email').fill(TEST_EMAIL);
    await page.getByPlaceholder('Password').fill(TEST_PASS);
    await page.getByRole('button', { name: /login/i }).click();

    // optional 2FA detection block...
    const otpInput = page.locator('#TwoFactorOtp');
    let requires2FA;
    try {
      // If this finds the OTP input within 10s, we consider 2FA required
      await otpInput.waitFor({ timeout: 40000 });
      requires2FA = true;
      console.log(`2FA screen detected for ${projectName}`);
    } catch {
      requires2FA = false;
    }

    if (requires2FA) {
      console.log(`Fetching GMAIL OTP for ${projectName}...`);

      const otp = await getOtpFromGmailForProject(projectName);
      console.log(`Using OTP for ${projectName}:`, otp);

      await otpInput.fill(otp);
      await page.getByRole('button', { name: /verify/i }).click();
    }

    await expect(page).toHaveTitle(/Dashboard/i);
  });
});
