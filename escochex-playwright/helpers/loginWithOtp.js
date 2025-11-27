// helpers/loginWithOtp.js
require('dotenv').config();
const { waitForNewOtp } = require('../helpers/otpHelperGmail');
/**
 * Logs in using username + password + OTP (from IMAP)
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 */
async function loginWithOtp(page, testInfo) {

  const projectName = testInfo.project.name.toUpperCase(); // CHROMIUM/FIREFOX/WEBKIT
  const username =
    process.env[`TEST_EMAIL_${projectName}`] || process.env.ESC_LOGIN_USER;
  const password = process.env.TEST_EMAIL_PASS;

  console.log('=== loginWithOtp START ===');
  console.log('Project:', projectName);
  console.log('Login username (masked):', username?.replace(/.(?=.{3})/g, '*'));

  await page.goto(process.env.BASE_URL);
  console.log('Navigated to login URL:', process.env.BASE_URL);

  await page.getByText(/sign in/i).click();
  await page.getByText(/super admin/i).click();

  await page.getByPlaceholder('Email', username);
  await page.getByPlaceholder('Password', password);
  console.log('Filled username & password.');

  // timestamp right before triggering OTP
  const since = new Date();
  console.log('Timestamp BEFORE clicking "Send OTP":', since.toISOString());

  const otpInput = await page.getByPlaceholder(/Enter OTP here/i);
  console.log('Clicked "Send OTP", waiting for email...');

  const otp = await waitForNewOtp({ projectName, since });

  console.log('Received OTP (masked):', otp.replace(/\d(?=\d{2})/g, '*'));

  await page.fill(otpInput, otp);
  console.log('Filled OTP input.');

  await page.getByRole('button',(/verify/i)).click();
  console.log('Clicked Verify.');
  console.log('=== loginWithOtp END ===');
}

module.exports = { loginWithOtp };
