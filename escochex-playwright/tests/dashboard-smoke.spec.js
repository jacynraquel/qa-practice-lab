// tests/dashboard-smoke.spec.js
const { test, expect } = require('@playwright/test');
const { loginWithOtpYopmail } = require('../helpers/loginWithOtpYopmail'); // <-- your existing Yopmail-based helper

test.describe('Escochex Dashboard Smoke Tests', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Reuse your working login (currently using Yopmail OTP)
    await loginWithOtpYopmail(page, testInfo);
  });

  test('shows main dashboard summary cards', async ({ page }) => {
    // Top summary cards
    await expect(page.getByText(/Total Employee/i)).toBeVisible();
    await expect(page.getByText(/All Benefits/i)).toBeVisible();
    await expect(page.getByText(/Total Companies/i)).toBeVisible();
    await expect(page.getByText(/Total Projects/i)).toBeVisible();
  });

  test('shows TODOS section with at least one item', async ({ page }) => {
    await expect(page.getByText(/TODOS/i)).toBeVisible();

    // One of the TODO lines has “Taxes of”
    const todoItem = page.getByText(/Taxes of/i).first();
    await expect(todoItem).toBeVisible();
  });

  test('shows Auto Tax Payments table with at least one business row', async ({ page }) => {
    await expect(
      page.getByText(/CURRENT STATUS OF AUTO TAX PAYMENTS/i)
    ).toBeVisible();

    // Table header “Business Name”
    await expect(page.getByText(/Business Name/i)).toBeVisible();

    // At least one row like “Accountant1Client1” (adjust if needed)
    const firstRow = page.getByText(/Accountant1Client1|Accountant1Client2|Acer pvt\. ltd\.|Additional Arizona|Airbus/i).first();
    await expect(firstRow).toBeVisible();
  });

  test('shows Salary Graph section', async ({ page }) => {
    await expect(page.getByText(/SALARY GRAPH/i)).toBeVisible();

    // If there is a canvas or chart element, you can also check for it
    // Example (adjust selector as needed):
    // const chart = page.locator('canvas').first();
    // await expect(chart).toBeVisible();
  });
});
