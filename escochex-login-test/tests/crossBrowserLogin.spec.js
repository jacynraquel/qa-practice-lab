// crossBrowserLogin.spec.js
import { Builder, By, until } from 'selenium-webdriver';
import { expect } from 'chai';

// Browsers to test (Safari replaces Edge)
const BROWSERS = ['chrome', 'firefox', 'safari'];

// Escochex staging URL (replace this)
const BASE_URL = 'https://dev.app-escochex.com';

async function buildDriver(browserName) {
  return await new Builder().forBrowser(browserName).build();
}

async function checkIf2FAExists(driver) {
  try {
    await driver.wait(
      until.elementLocated(By.css("input[name='otp']")),
      5000
      );
    return true; // 2FA exists
  } catch {
    return false; // no 2FA
  }
}


async function runLoginFlow(driver) {
  await driver.get(BASE_URL);

  // Replace selectors with your real Escochex elements
  await driver.findElement(By.id('email')).sendKeys('jacynr@escochecks.com');
  await driver.findElement(By.id('password')).sendKeys('Jacyn@1234');
  await driver.findElement(By.css('button[type=submit]')).click();

  await driver.findElement(By.css('button[type=submit]')).click();

  const has2FA = await checkIf2FAExists(driver);

  if (has2FA) {
    console.log("2FA detected, entering code...");
    const otpInput = await driver.findElement(By.css("input[name='otp']"));
    await otpInput.sendKeys("123456");
    await driver.findElement(By.css("button[type=submit]")).click();
  } else {
    console.log("No 2FA detected.");
  }

  // Wait for dashboard header
  const dashboardHeader = await driver.wait(
    until.elementLocated(By.xpath("//*[contains(text(),'Dashboard')]")),
    10000
    );

  const text = await dashboardHeader.getText();
  expect(text).to.include('Dashboard');
}

BROWSERS.forEach((browserName) => {
  describe(`Login test on ${browserName}`, function () {
    this.timeout(30000); // allow enough time for each browser

    let driver;

    before(async () => {
      driver = await buildDriver(browserName);
    });

    after(async () => {
      if (driver) await driver.quit();
    });

    it('should login and show the Dashboard', async () => {
      await runLoginFlow(driver);
    });
  });
});
