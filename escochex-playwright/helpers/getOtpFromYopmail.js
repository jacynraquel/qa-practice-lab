const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

module.exports.getLatestOtpFromYopmail = async (page, inboxName) =>{

  if (!inboxName) {
    throw new Error('Inbox name missing! Make sure you passed inboxName into getLatestOtpFromYopmail.');
  }

  const context = page.context();
  const yopPage = await context.newPage();

  // Open the specific inbox
  await yopPage.goto(`https://yopmail.com/?${inboxName}`);

  // 1. LEFT FRAME: inbox list
  const inboxFrame = yopPage.frameLocator('#ifinbox');

  // Wait until at least one email row is present
  const messages = inboxFrame.locator('div.m');
  await messages.first().waitFor({ timeout: 20000 });

  // Optional: debug what we're seeing
  const count = await messages.count();
  console.log(`Found ${count} messages in inbox: ${inboxName}`);
  for (let i = 0; i < Math.min(count, 5); i++) {
    const preview = (await messages.nth(i).innerText()).slice(0, 80);
    console.log(`Row ${i}: ${preview}`);
  }

  // Click the *visually* top row.
  // If YOPmail shows newest at the top → nth(0) / first()
  // If it shows newest at the bottom → nth(count-1) / last()

  await messages.nth(0).click();        // 👈 newest on top case
  // await messages.last().click();    // 👈 switch to this if DOM is reversed

  // 2. RIGHT FRAME: email body
  const mailFrame = yopPage.frameLocator('#ifmail');
  const mailBody = mailFrame.locator('#mail');
  await mailBody.waitFor({ timeout: 20000 });

  const bodyText = await mailBody.innerText();

  // 3. Extract 6-digit OTP
  const match = bodyText.match(/(\d{6})/);
  if (!match) {
    throw new Error('No 6-digit OTP found in YOPmail email body');
  }

  const otp = match[1];

  await yopPage.close();   // optional
  return otp;
}