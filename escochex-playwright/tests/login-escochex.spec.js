// tests/login-escochex.spec.js
const { test, expect } = require('@playwright/test');
const {getLatestOtpFromYopmail} = require('../helpers/getOtpFromYopmail');

const BASE_URL = process.env.BASE_URL;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASS = process.env.TEST_PASS;

test.describe('Escochex Login & Dashboard with 2FA (Yopmail)', () => {
  test('should login and show Dashboard', async ({ page, context }) => {
    // 1. Go to login page
    await page.goto(BASE_URL, {waitUntil: 'networkidle'});

    // 2. Login
	// Click SIGN IN link
	await page.getByText('Sign In', { exact: true }).click();

	// Wait for submenu to appear
	await page.getByText('Super Admin', {exact: true}).click();

    await page.getByPlaceholder('Email').fill(TEST_EMAIL);
  	await page.getByPlaceholder('Password').fill(TEST_PASS);
    await page.getByRole('button', { name: 'Login' }).click();


    // 3. Wait for 2FA input (adjust selector based on your 2FA page)
    const otpInput = page.locator('input[id="TwoFactorOtp"]'); // or whatever Inspector gave you
    await expect(otpInput).toBeVisible({ timeout: 20000 });

    // 4. Fetch OTP from Yopmail using the same browser context
    const otp = await getLatestOtpFromYopmail(page, 'escochex.qa');
  	console.log('Got OTP:', otp);

  	// 5. Enter OTP & verify
  	await page.fill('input[id="TwoFactorOtp"]', otp);
  	await page.getByRole('button', { name: 'Verify' }).click();


    // 6. Assert Dashboard
    await expect(page.getByText('Dashboard')).toBeVisible();
    // or a more specific locator:
    // await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});
