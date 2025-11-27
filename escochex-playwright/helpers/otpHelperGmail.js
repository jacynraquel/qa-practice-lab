const { ImapFlow } = require('imapflow');

const OTP_REGEX = /\b(\d{6})\b/;
const DEBUG_OTP = process.env.DEBUG_OTP === 'true'; // turn on logs via .env

function logOtp(...args) {
  if (DEBUG_OTP) {
    console.log('[OTP]', ...args);
  }
}

/**
 * Create IMAP client for qa@escochex.com
 */
function getImapClient() {
  logOtp('Creating IMAP client with:', {
    host: process.env.IMAP_HOST,
    port: process.env.IMAP_PORT,
    user: process.env.IMAP_USER,
  });

  return new ImapFlow({
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT),
    secure: true,
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASS,
    },
    logger: false,
  });
}

/**
 * Wait for the NEWEST OTP email for a specific project.
 *
 * @param {Object} params
 * @param {string} params.projectName  - e.g. "CHROMIUM"
 * @param {Date}   params.since        - timestamp before clicking "Send OTP"
 * @param {number} [params.timeoutMs]  - optional, default 60000
 */
async function waitForNewOtp({ projectName, since, timeoutMs = 60000 }) {
  const client = getImapClient();
  const subjectPrefix =
    process.env[`TEST_EMAIL_${projectName}`] || '';

  const sinceDate = since || new Date();
  const deadline = Date.now() + timeoutMs;

  logOtp(`--- waitForNewOtp START (${projectName}) ---`);
  logOtp('Using subjectPrefix:', subjectPrefix);
  logOtp('Using sinceDate:', sinceDate.toISOString());
  logOtp('Timeout (ms):', timeoutMs);

  try {
    logOtp('Connecting to IMAP...');
    await client.connect();
    logOtp('Connected. Opening INBOX...');
    await client.mailboxOpen('INBOX');
    logOtp('INBOX opened.');

    let otpCode = null;
    let attempt = 0;

    while (!otpCode && Date.now() < deadline) {
      attempt++;
      logOtp(`Search attempt #${attempt}`);

      // Search for messages since the login attempt with matching subject
      const uids = await client.search({
        since: sinceDate,
        header: ['subject', subjectPrefix],
      });

      logOtp('Search result UIDs:', uids);

      if (uids.length > 0) {
        const newestUid = Math.max(...uids);
        logOtp('Newest UID chosen:', newestUid);

        for await (const msg of client.fetch(
          { uid: newestUid },
          { envelope: true, source: true }
        )) {
          const subject = msg.envelope?.subject;
          logOtp('Fetched message:', {
            uid: newestUid,
            subject,
          });

          const raw = msg.source.toString();
          const match = raw.match(OTP_REGEX);

          if (match) {
            otpCode = match[1];
            logOtp('✅ OTP FOUND for', projectName, '=>', otpCode);
            break;
          } else {
            logOtp('❌ No OTP match found in this email body.');
          }
        }
      } else {
        logOtp('No matching emails yet. Will retry...');
      }

      if (!otpCode) {
        const remaining = deadline - Date.now();
        logOtp('Waiting 2s before next search. Remaining ms:', remaining);
        await new Promise((res) => setTimeout(res, 2000));
      }
    }

    if (!otpCode) {
      logOtp('⛔ Timed out waiting for OTP for', projectName);
      throw new Error(`Timed out waiting for new OTP email for ${projectName}`);
    }

    logOtp(`--- waitForNewOtp END (${projectName}) ---`);
    return otpCode;
  } finally {
    logOtp('Logging out from IMAP...');
    await client.logout().catch((err) => {
      logOtp('Error on logout (ignored):', err?.message);
    });
  }
}

module.exports = {
  waitForNewOtp
};
