const { test, expect } = require('@playwright/test');
const { getLatestOtpFromYopmail } = require('../helpers/getOtpFromYopmail');

test.describe('Escochex Login & Dashboard with 2FA (Yopmail)', () => {
  test('should login and show Dashboard', async ({ page }, testInfo) => {
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
    let requires2FA = true;
    try {
      await otpInput.waitFor({ timeout: 5000 });
    } catch {
      requires2FA = false;
    }

    if (requires2FA) {
      console.log(`2FA detected for ${projectName} – fetching OTP for inbox ${YOPMAIL_INBOX}`);
      const otp = await getLatestOtpFromYopmail(page, YOPMAIL_INBOX);
      console.log('Got OTP:', otp);

      await otpInput.fill(otp);
      await page.getByRole('button', { name: /verify/i }).click();
    } else {
      console.log(`No 2FA for ${projectName}, continuing…`);
    }

    await expect(page).toHaveTitle(/Dashboard/i);
  });
});
