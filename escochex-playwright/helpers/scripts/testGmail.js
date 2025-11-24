// testGmailList.js
const { google } = require('googleapis');
require('dotenv').config();

function getGmailClient() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oAuth2Client });
}

(async () => {
  try {
    const gmail = getGmailClient();
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5,
    });
    console.log('Messages:', res.data.messages);
  } catch (err) {
    console.error(err);
  }
})();
