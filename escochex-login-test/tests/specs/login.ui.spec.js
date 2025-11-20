// tests/specs/login.spec.js
import { LoginPage } from '../pages/LoginPage.js';
import { getPage } from '../hooks/globalHooks.js';
import { expect } from 'chai';

const BASE_URL = process.env.BASE_URL;
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;

describe('Login Tests', function () {
  it('should load the login page', async () => {
    const page = getPage();
    const loginPage = new LoginPage(page, BASE_URL);

    const resp = await loginPage.goto(1);
    expect(resp?.status()).to.be.oneOf([200, 304]);

    await loginPage.waitForReady();
  });

  it('should login successfully', async () => {
    const page = getPage();
    const loginPage = new LoginPage(page, BASE_URL);

    await loginPage.loginWithValidCredentials(USER_EMAIL, USER_PASSWORD);

    const url = page.url().toLowerCase();
    expect(url).to.not.include('account/login');
  });
});
