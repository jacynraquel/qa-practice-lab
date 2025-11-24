export class LoginPage {
  /**
   * @param {import('playwright').Page} page
   * @param {string} baseUrl
   */
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;

    // Reuse your original selector strategy
    this.sel = {
      email: '#Input_Email, input[name="Email"], input[type="email"]',
      password: '#Input_Password, input[name="Password"], input[type="password"]',
      submit: '#login-submit, button[type="submit"], input[type="submit"]',
      error: '.field-validation-error, [data-test-id="login-error"], .text-danger, .alert-danger'
    };
  }

  /**
   * Go to the login page (default Role=1).
   */
  async goto(role = 1) {
    const resp = await this.page.goto(
      `${this.baseUrl}/Account/Login?Role=${role}`,
      { timeout: 60000 }
    );
    return resp;
  }

  /**
   * Wait until the login page is ready for interaction.
   */
  async waitForReady() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForSelector(this.sel.email, { timeout: 15000 });
  }

  /**
   * Fill email + password fields.
   */
  async fillCredentials(email, password) {
    await this.page.fill(this.sel.email, email);
    await this.page.fill(this.sel.password, password);
  }

  /**
   * Click submit (or press Enter) with optional navigation wait.
   *
   * @param {Object} [opts]
   * @param {boolean} [opts.waitForNav=true]
   * @param {import('playwright').WaitForNavigationOptions} [opts.navOptions]
   */
  async submit({ waitForNav = true, navOptions } = {}) {
    let navPromise = Promise.resolve(null);

    if (waitForNav) {
      navPromise = this.page
        .waitForNavigation(navOptions ?? { timeout: 15000 })
        .catch(() => null);
    }

    const submit = this.page.locator(this.sel.submit).first();
    if (await submit.count()) {
      await Promise.allSettled([navPromise, submit.click()]);
    } else {
      await Promise.allSettled([
        navPromise,
        this.page.press(this.sel.password, 'Enter')
      ]);
    }
  }

  /**
   * Convenience: full valid login flow, with dashboard-style URL expectation.
   */
  async loginWithValidCredentials(email, password) {
    await this.goto(1);
    await this.waitForReady();
    await this.fillCredentials(email, password);
    await this.submit({
      waitForNav: true,
      navOptions: {
        url: url =>
          /dashboard|home|^https?:\/\/[^/]+\/?$/.test(url.toLowerCase()),
        timeout: 45000
      }
    });
  }

  /**
   * Return error text if visible (prioritizing "invalid" messages).
   */
  async getErrorText() {
    // First try explicit "invalid" text (your original selector)
    const invalidLocator = this.page.locator('text=/invalid/i');
    if (await invalidLocator.count()) {
      await invalidLocator.first().waitFor({
        state: 'visible',
        timeout: 15000
      });
      return (await invalidLocator.first().textContent()) ?? '';
    }

    // Fallback to generic error container
    const genericError = this.page.locator(this.sel.error);
    if (await genericError.count()) {
      await genericError.first().waitFor({
        state: 'visible',
        timeout: 15000
      });
      return (await genericError.first().textContent()) ?? '';
    }

    return '';
  }
}
