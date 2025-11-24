// otpHelper.js
const { google } = require('googleapis');
require('dotenv').config();

const OTP_REGEX = /\b(\d{6})\b/; // adjust to your OTP length

// -----------------------------------------------------------------------------
// OAuth2 Gmail Client (using refresh token)
// -----------------------------------------------------------------------------
function getGmailClient() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
    // redirect URI is not needed when using a stored refresh token
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oAuth2Client });
}

// -----------------------------------------------------------------------------
// Base64URL decoder (Gmail uses Base64URL, not normal Base64)
// -----------------------------------------------------------------------------
function decodeBase64Url(data) {
  if (!data) return '';

  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = normalized.length % 4;
  const padded =
    padLength === 0
      ? normalized
      : normalized + '='.repeat(4 - padLength);

  return Buffer.from(padded, 'base64').toString('utf8');
}

// -----------------------------------------------------------------------------
// Extract body text from any Gmail message (handles multipart emails)
// -----------------------------------------------------------------------------
function extractBody(payload) {
  let text = '';

  function walk(part) {
    if (!part) return;

    if (part.mimeType === 'text/plain' && part.body?.data) {
      text += decodeBase64Url(part.body.data) + '\n';
    }

    if (part.parts && part.parts.length) {
      part.parts.forEach(walk);
    }
  }

  walk(payload);

  return text.trim();
}

// -----------------------------------------------------------------------------
// MAIN FUNCTION — get OTP by browser project (Chromium, Firefox, WebKit)
// -----------------------------------------------------------------------------
async function getOtpFromGmailForProject(projectName) {
  const gmail = getGmailClient();

  const loginEmail = process.env[`YOPMAIL_INBOX_${projectName}`];
  const sender = process.env.OTP_SENDER || 'no-reply@escochex.com';

  if (!loginEmail) {
    throw new Error(
      `Missing YOPMAIL_INBOX_${projectName} in .env (e.g. YOPMAIL_INBOX_CHROMIUM)`
    );
  }

  // Gmail search query
  const query = [
    `from:${sender}`,
    `to:${loginEmail}`,
    'newer_than:5m' // avoid old OTPs
  ].join(' ');

  // 1) Get newest matching email
  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 5,
  });

  const msgs = listRes.data.messages || [];
  if (!msgs.length) {
    throw new Error(
      `No OTP email found for ${projectName} (${loginEmail})`
    );
  }

  const msgId = msgs[0].id;

  // 2) Fetch full email
  const msgRes = await gmail.users.messages.get({
    userId: 'me',
    id: msgId,
    format: 'full',
  });

  const payload = msgRes.data.payload;
  const bodyText = extractBody(payload) || msgRes.data.snippet || '';

  // 3) Extract OTP
  const match = bodyText.match(OTP_REGEX);
  if (!match) {
    console.log("DEBUG — email body:\n", bodyText);
    throw new Error(`OTP not found in email for ${projectName}`);
  }

  return match[1];
}

module.exports = { getOtpFromGmailForProject };
