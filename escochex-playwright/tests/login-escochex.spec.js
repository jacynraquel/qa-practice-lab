// tests/login-escochex.spec.js
const { test, expect } = require('@playwright/test');
const { loginWithOtp } = require('../helpers/loginWithOtp');

test.describe('Escochex Login with OTP', () => {
  test('should log in successfully using username + password + OTP', async ({ page }, testInfo) => {
    console.log('=== Escochex login test START ===');
    console.log('Running project:', testInfo.project.name);

    // 1. Perform the full login flow (username + password + OTP from IMAP)
    await loginWithOtp(page, testInfo);

    // 2. Assert that login worked (adjust selector to your real dashboard)
    // Example: look for "Dashboard" text or a known element in the home page
    const dashboardHeader = page.getByText('Dashboard');
    await expect(dashboardHeader).toBeVisible({ timeout: 15000 });

    console.log('✅ Escochex login test PASSED for project:', testInfo.project.name);
  });
});
