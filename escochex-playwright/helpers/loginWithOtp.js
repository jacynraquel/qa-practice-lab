// tests/helpers/loginWithOtp.js
const { getOtpFromGmailForProject } = require('./otpHelperGmail');
require('dotenv').config();

/**
 * Logs in to Escochex using username + password + OTP (from IMAP)
 * 
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 */
async function loginWithOtp(page, testInfo) {
  const projectName = testInfo.project.name.toUpperCase(); // CHROMIUM / FIREFOX / WEBKIT

  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) {
    throw new Error('BASE_URL is not set in .env');
  }

  // 1. Go to login page
  await page.goto(baseUrl);

  // 2. Fill username/password for this browser
  const emailEnvKey = `YOPMAIL_INBOX_${projectName}`;
  const passEnvKey = `TEST_PASS_${projectName}`;
  const username = process.env[emailEnvKey];
  const password = process.env[passEnvKey];

  if (!username || !password) {
    throw new Error(
      `Missing ${emailEnvKey} or ${passEnvKey} in .env for project ${projectName}`
    );
  }

  // TODO: adjust selectors to match your login page
  await page.getByPlaceholder('Email').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // 3. Wait for OTP screen to show up
  // Adjust selector(s) to match your OTP input
  const otpInput = page.getByRole('textbox', { name: /otp|code/i }).first();
  await otpInput.waitFor({ state: 'visible' });

  // 4. Fetch OTP via IMAP

  const otp = await getOtpFromGmailForProject(projectName);
  console.log(`[${projectName}] Using OTP:`, otp);

  await otpInput.fill(otp);

  // 5. Submit OTP
  await page.getByRole('button', { name: /verify|submit|continue/i }).click();

  // 6. Wait for dashboard (sanity check selector – adjust as needed)
  await page.getByText('Dashboard', { exact: false }).waitFor({ timeout: 15000 });
}

module.exports = { loginWithOtp };
