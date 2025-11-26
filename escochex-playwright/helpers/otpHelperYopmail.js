// helpers/otpHelperYopmail.js
// Reads OTP from Yopmail using Playwright browser context

const OTP_REGEX = /\b(\d{6})\b/; // 6-digit OTP

/**
 * Fetch latest OTP from Yopmail using Playwright context
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} inbox
 * @returns {Promise<string>}
 */
async function getLatestOtpFromYopmail(page, inbox) {
  console.log(`Fetching OTP from Yopmail inbox: ${inbox}`);

  // Open Yopmail inbox (without iframe restrictions)
  await page.goto(`https://yopmail.com/?${inbox}`, { waitUntil: "networkidle" });

  // Click “Check Inbox”
  await page.click('#refreshbut'); // refresh button

  // Yopmail loads emails inside an iframe → get the iframe
  const mailFrame = page.frameLocator('#ifinbox');

  // Wait for at least one email list row
  await mailFrame.locator('.m').first().waitFor({ timeout: 10000 });

  // Click the first email
  await mailFrame.locator('.m').first().click();

  // The email body loads in a different iframe
  const bodyFrame = page.frameLocator('#ifmail');

  // Wait for message body
  await bodyFrame.locator('body').waitFor({ timeout: 10000 });

  const bodyText = await bodyFrame.locator('body').innerText();

  const match = bodyText.match(OTP_REGEX);

  if (!match) {
    throw new Error(`Could not find OTP in Yopmail inbox: ${inbox}`);
  }

  console.log(`OTP extracted from Yopmail: ${match[1]}`);
  return match[1];
}

module.exports = { getLatestOtpFromYopmail };
