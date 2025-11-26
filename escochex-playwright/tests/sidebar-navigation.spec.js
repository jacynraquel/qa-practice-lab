// tests/sidebar-navigation.spec.js
const { test, expect } = require('@playwright/test');
// const { loginWithOtpYopmail } = require('../helpers/loginWithOtpYopmail'); // your existing login helper
const {loginWithOtp} = require('../helpers/loginWithOtp');
require('dotenv').config();

async function clickSidebarPath(page, labels) {
  // labels: ['Payroll'] or ['Payroll', 'Import Paystubs']
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];

    // First try as a link
    const linkLocator = page.getByRole('link', { name: label, exact: true });
    if (await linkLocator.count()) {
      await linkLocator.first().click();
      continue;
    }

    // If not a link, try as a button (for dropdown toggles)
    const buttonLocator = page.getByRole('button', { name: label, exact: true });
    if (await buttonLocator.count()) {
      await buttonLocator.first().click();
      continue;
    }

    // Fallback: plain text if roles are not set nicely
    const textLocator = page.getByText(label, { exact: true });
    if (await textLocator.count()) {
      await textLocator.first().click();
      continue;
    }

    throw new Error(`Could not find sidebar item with label: "${label}"`);
  }
}

// List of sidebar items to test
// Adjust `menuText` and `assert` blocks to match the actual page text if needed.
const sidebarPages = [
  {
    name: 'Partner Portal',
    menuText: 'Partner Portal',
    assert: async (page) => {
      await expect(page.getByText(/Partner Portal/i)).toBeVisible();
      // await expect(page.getByText(/Partner List/i)).toBeVisible();
    }
  }
  // {
  //   name: 'Efilings Dashboards',
  //   menuText: 'Efilings Dashboards',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Efilings Dashboards/i)).toBeVisible();
  //     // await expect(page.getByText(/Quarterly Efilings/i)).toBeVisible();
  //   }
  // },
  // {
  //   name: 'Admin Dashboard',
  //   menuText: 'Admin Dashboard',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Admin Dashboard/i)).toBeVisible();

  //   },
  // },
  // {
  //   name: 'Super Admin Dashboard',
  //   menuText: 'Super Admin Dashboard',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Super Admin Dashboard/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Business Info',
  //   menuText: 'Business Info',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Business Info/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Other Company Setup',
  //   menuText: 'Other Company Setup',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Other Company Setup/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Security And Access',
  //   menuText: 'Security And Access',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Security/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Contractors',
  //   menuText: 'Contractors',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Contractors/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Tax Forms',
  //   menuText: 'Tax Forms',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Tax Forms/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Employees',
  //   menuText: 'Employees',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Employees/i)).toBeVisible();
  //     // e.g. table header or button
  //     // await expect(page.getByRole('button', { name: /Add Employee/i })).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Other Benefits',
  //   menuText: 'Other Benefits',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Other Benefits/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Other Deduction',
  //   menuText: 'Other Deduction',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Other Deduction/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Payroll',
  //   menuText: 'Payroll',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Payroll/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Medicare Cost Reports',
  //   menuText: 'Medicare Cost Reports',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Medicare/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: 'Payroll Reports',
  //   menuText: 'Payroll Reports',
  //   assert: async (page) => {
  //     await expect(page.getByText(/Payroll Reports/i)).toBeVisible();
  //   },
  // },
  // {
  //   name: "Worker's Comp Reports",
  //   menuText: "Worker's Comp Reports",
  //   assert: async (page) => {
  //     await expect(page.getByText(/Worker'?s Comp/i)).toBeVisible();
  //   },
  // }
];




test.describe('Sidebar navigation smoke tests', () => {
  // Reuse login for each test so each page is independent
  test.beforeEach(async ({ page }, testInfo) => {
    await loginWithOtp(page, testInfo);
  });

  for (const item of sidebarPages) {
    test(`can navigate to ${item.name} via sidebar`, async ({ page }) => {
      // Click sidebar menu item
      await page.getByRole('link', { name: item.menuText, exact: true }).click();

      // Run the assertion for that page
      await item.assert(page);
    });
  }
});
