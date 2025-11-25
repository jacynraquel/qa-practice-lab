// debugOtp.js
const { getOtpFromGmailForProject } = require('../otpHelperGmail');
require('dotenv').config();

(async () => {
  try {
    const otp = await getOtpFromGmailForProject('CHROMIUM'); // or FIREFOX/WEBKIT
    console.log('OTP found:', otp);
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
