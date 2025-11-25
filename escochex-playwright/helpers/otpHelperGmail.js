// otpHelper.js (IMAP version – no OAuth)
const { ImapFlow } = require('imapflow');
require('dotenv').config();

const OTP_REGEX = /\b(\d{6})\b/; // adjust to your OTP format

async function getOtpFromGmailForProject(projectName) {
  const loginEmail = process.env[`YOPMAIL_INBOX_${projectName}`];
  const sender = process.env.OTP_SENDER || 'no-reply@escochex.com';

  if (!loginEmail) {
    throw new Error(
      `Missing YOPMAIL_INBOX_${projectName} in .env (e.g. YOPMAIL_INBOX_CHROMIUM)`
    );
  }

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: Number(process.env.IMAP_PORT) || 993,
    secure: true,
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASS,
    },
  });

  await client.connect();

  try {
    // Open INBOX in read-only mode
    let lock = await client.getMailboxLock('INBOX');
    try {
      // Search: from sender, to loginEmail, last 5 minutes
      const since = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago

      const messages = await client.search({
        from: sender,
        to: loginEmail,
        since,
      }, { uid: true });

      if (!messages.length) {
        throw new Error(`No OTP email found for ${projectName} (${loginEmail})`);
      }

      // Messages are sorted by UID; latest is last
      const latestUid = messages[messages.length - 1];

      const msg = await client.fetchOne(latestUid, {
        source: true,
        bodyStructure: true,
        envelope: true,
        bodyParts: ['text'],
      });

      // Get the text body
      let body = '';

      if (msg.text) {
        body = msg.text;
      } else if (msg.source) {
        body = msg.source.toString('utf8');
      }

      const match = body.match(OTP_REGEX);
      if (!match) {
        console.log('DEBUG – email body:\n', body);
        throw new Error(`OTP not found in email for ${projectName}`);
      }

      return match[1];
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

module.exports = { getOtpFromGmailForProject };
