// helpers/loginWithOtpYopmail.js
const { getLatestOtpFromYopmail } = require('./otpHelperYopmail');
require('dotenv').config();

/**
 * Logs in to Escochex using username + password + 2FA from Yopmail
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 */
async function loginWithOtpYopmail(page, testInfo) {
  const projectName = testInfo.project.name.toUpperCase(); // CHROMIUM, FIREFOX, WEBKIT

  const TEST_EMAIL = process.env[`TEST_EMAIL_${projectName}`];
  const TEST_PASS = process.env[`TEST_PASS_${projectName}`];
  const YOPMAIL_INBOX = process.env[`YOPMAIL_INBOX_${projectName}`];

  if (!TEST_EMAIL || !TEST_PASS || !YOPMAIL_INBOX) {
    throw new Error(
      `Missing TEST_EMAIL_${projectName}, TEST_PASS_${projectName} or YOPMAIL_INBOX_${projectName} in .env`
    );
  }

  console.log(`Login starting for ${projectName}`);
  console.log(`Using email: ${TEST_EMAIL}`);

  // Go to URL
  await page.goto(process.env.BASE_URL);

  // Click Sign in → Super Admin
  await page.getByText('Sign In', { exact: true }).click();
  await page.getByText('Super Admin', { exact: true }).click();

  await page.getByPlaceholder('Email').fill(TEST_EMAIL);
  await page.getByPlaceholder('Password').fill(TEST_PASS);
  await page.getByRole('button', { name: /login/i }).click();

  // Wait for OTP
  const otpInput = page.locator('#TwoFactorOtp');
  let requires2FA = true;

  try {
    await otpInput.waitFor({ timeout: 8000 });
  } catch {
    // If no 2FA — continue normally
    console.log(`No OTP required for ${projectName}`);
    requires2FA = false;
  }

  if (requires2FA) {
    console.log(`OTP required → fetching from Yopmail inbox: ${YOPMAIL_INBOX}`);
    await page.newPage();
    const otp = await getLatestOtpFromYopmail(page, YOPMAIL_INBOX);

    await otpInput.fill(otp);
    await page.getByRole('button', { name: /verify|submit|continue/i }).click();
  }

  // Dashboard should load
  await page.getByText(/Dashboard/i).waitFor({ timeout: 20000 });

  console.log(`Login success for ${projectName}`);
}

module.exports = { loginWithOtpYopmail };
