// otpHelper.js
const { ImapFlow } = require('imapflow');
require('dotenv').config();

// TODO: make this more specific to your template later
const OTP_REGEX =
  /Your One-Time Password \(OTP\) for Login into the Escochex application is:\s*([0-9]{6})/;

/**
 * Get OTP from qa@escochex.com IMAP inbox for a specific login email
 * (mapped from projectName).
 *
 * - Searches ONLY UNSEEN messages
 * - Filters by sender + actual login email in To/CC/Bcc
 * - Marks the chosen message as SEEN
 */
async function getOtpFromGmailForProject(projectName) {
  const sender = process.env.OTP_SENDER || 'no-reply@escochex.com';

  // Email used on the login page for this project (CHROMIUM/FIREFOX/WEBKIT)
  const targetLoginEmail =
    process.env[`TEST_EMAIL_${projectName}`];

  if (!targetLoginEmail) {
    throw new Error(
      `Missing TEST_EMAIL_${projectName} in .env (e.g. LOGIN_EMAIL_CHROMIUM)`
    );
  }

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: Number(process.env.IMAP_PORT) || 993,
    secure: true,
    auth: {
      user: process.env.IMAP_USER, // qa@escochex.com
      pass: process.env.IMAP_PASS,
    },
  });

  await client.connect();

  try {
    let lock = await client.getMailboxLock('INBOX');
    try {
      const timeoutMs = 60000;      // wait up to 60s
      const pollIntervalMs = 3000;  // check every 3s
      const start = Date.now();

      let chosenUid = null;
      let chosenMsg = null;

      while (Date.now() - start < timeoutMs) {
        // Step 1: get all UNSEEN messages from OTP sender
        const candidateUids = await client.search(
          { from: sender, 
            seen: false,
            subject:"Two-Factor Authentication - One-Time Password (OTP)"
          },
          { uid: true }
        );

        if (candidateUids.length) {
          // Fetch envelopes for all candidates, newest last
          const messages = [];
          for (const uid of candidateUids) {
            const msg = await client.fetchOne(uid, {
              envelope: true,
              bodyParts: ['text'],
              source: true,
            });
            messages.push({ uid, msg });
          }

          // Step 2: find the latest message that has the target login email
          const lowerTarget = targetLoginEmail.toLowerCase();

          const matches = messages.filter(({ msg }) => {
            const subject = msg.envelope?.subject?.toLowerCase() || '';
            const expectedSubject = "two-factor authentication - one-time password (otp)";
            const toAddrs = (msg.envelope?.to || []).map(t => t.address?.toLowerCase());
            const ccAddrs = (msg.envelope?.cc || []).map(t => t.address?.toLowerCase());
            const bccAddrs = (msg.envelope?.bcc || []).map(t => t.address?.toLowerCase());

            return (
              subject.includes(expectedSubject) &&
              (
                toAddrs.includes(lowerTarget) ||
                ccAddrs.includes(lowerTarget) ||
                bccAddrs.includes(lowerTarget)
              )
            );
          });

          if (matches.length) {
            // pick the last (latest) match
            const { uid, msg } = matches[matches.length - 1];
            chosenUid = uid;
            chosenMsg = msg;

            console.log('DEBUG – chosen OTP email:', {
              projectName,
              uid: chosenUid,
              subject: chosenMsg.envelope?.subject,
              to: chosenMsg.envelope?.to?.map(t => t.address).join(', '),
              cc: chosenMsg.envelope?.cc?.map(t => t.address).join(', '),
              date: chosenMsg.envelope?.date,
            });

            break;
          }
        }

        // No matching email yet → wait and poll again
        await new Promise(r => setTimeout(r, pollIntervalMs));
      }

      if (!chosenMsg) {
        throw new Error(
          `No UNSEEN OTP email found for ${projectName} addressed to ${targetLoginEmail} within timeout`
        );
      }

      // Step 3: read body (text → html → raw)
      let body = '';

      if (chosenMsg.text) {
        // Plain text body part
        body = chosenMsg.text.toString('utf8');
      } else if (chosenMsg.html) {
        // HTML body part (strip HTML tags)
        const html = chosenMsg.html.toString('utf8');
        body = html.replace(/<[^>]+>/g, ' ');
      } else if (chosenMsg.source) {
        // Raw MIME as last fallback
        body = chosenMsg.source.toString('utf8');
      }

      console.log('DEBUG – raw OTP body:\n', body);


      const match = body.match(OTP_REGEX);
      if (!match) {
        throw new Error(`OTP not found in email body for ${projectName}`);
      }

      const otp = match[1];
      console.log('DEBUG – extracted OTP:', otp);

      // Step 4: mark this message as SEEN so it won't be reused
      await client.messageFlagsAdd([chosenUid], ['\\Seen'], { uid: true });

      return otp;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

module.exports = { getOtpFromGmailForProject };
