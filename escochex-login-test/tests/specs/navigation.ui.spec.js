import { expect } from 'chai';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { SidebarNav } from '../pages/SidebarNav.js';
import { getPage } from '../hooks/globalHooks.js';

const BASE_URL = process.env.BASE_URL;
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;

describe('Navigation UI Smoke', function () {
  it('should show the dashboard after login', async () => {
    const page = getPage();
    const loginPage = new LoginPage(page, BASE_URL);
    const dashboardPage = new DashboardPage(page);

    await loginPage.loginWithValidCredentials(USER_EMAIL, USER_PASSWORD);

    const loaded = await dashboardPage.isLoaded();

     // 1. Navigate
    await page.click('text=Dashboard'); // or your menu selector

     // 2. Quick URL sanity check (optional but helpful)
    await expect(page).toHaveURL(/Dashboard/);
      
     // 3. Assert key elements using this.sel
    await expect(page.locator(this.sel.dashboardHeader)).toBeVisible();
    await expect(page.locator(this.sel.totalEmployeeCard)).toBeVisible();
    await expect(page.locator(this.sel.todosSection)).toBeVisible();
  });

  it('should navigate to Employees page from the sidebar', async () => {
    const page = getPage();
    const loginPage = new LoginPage(page, BASE_URL);
    const nav = new SidebarNav(page);

    await loginPage.loginWithValidCredentials(USER_EMAIL, USER_PASSWORD);

    await nav.goToEmployees();
    // later you can assert with EmployeesPage here
  });
});
