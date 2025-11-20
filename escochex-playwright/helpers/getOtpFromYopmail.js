const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

module.exports.getLatestOtpFromYopmail = async (page, inboxName) =>{
  const actualInbox = inboxName || 'escochex.qa';
  const context = page.context();

  const yopPage = await context.newPage();
  await yopPage.goto(`https://yopmail.com/?${actualInbox}`);

  // 1. LEFT frame: click newest email
  const inboxFrame = yopPage.frameLocator('#ifinbox');

  // Wait for at least one message row to appear
  const firstMessage = inboxFrame.locator('div.m').first();
  await firstMessage.waitFor({ timeout: 20000 });
  await firstMessage.click();

  // 2. RIGHT frame: read the email body
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

  await yopPage.close(); // optional
  return otp;
}