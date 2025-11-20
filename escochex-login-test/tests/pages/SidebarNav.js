export class SidebarNav {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.sel = {
      dashboardMenu: 'nav >> text=Dashboard',
      employeesMenu: 'nav >> text=Employees',
      payrollMenu: 'nav >> text=Tax Forms, nav >> text=Payroll', // adjust if needed
      // add more menu items as you need them
    };
  }

  async goToDashboard() {
    await this.page.click(this.sel.dashboardMenu);
  }

  async goToEmployees() {
    await this.page.click(this.sel.employeesMenu);
  }

  async goToPayroll() {
    await this.page.click(this.sel.payrollMenu);
  }
}
