export class DashboardPage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
    this.sel = {
      // main header text in the content area
      dashboardHeader: 'text=Dashboard',

      // key widgets (optional, but good for sanity)
      totalEmployeeCard: 'text=Total Employee',
      todosSection: 'text=TODOS'
    };
  }

  async waitForLoaded() {
    // small helper to wait until we "really" see the dashboard bits
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector(this.sel.dashboardHeader, { timeout: 30000 });
  }

  async isLoaded() {
    return this.page.isVisible(this.sel.dashboardHeader);
  }

  async hasTotalEmployeeCard() {
    return this.page.isVisible(this.sel.totalEmployeeCard);
  }

  async hasTodosSection() {
    return this.page.isVisible(this.sel.todosSection);
  }
}
