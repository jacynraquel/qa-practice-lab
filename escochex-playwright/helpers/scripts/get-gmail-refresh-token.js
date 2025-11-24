// get-gmail-refresh-token.js
const http = require('http');
const url = require('url');
const { google } = require('googleapis');
require('dotenv').config();

const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI,
} = process.env;

const oAuth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI
);

// Adjust scopes as needed (read-only is safest for OTP checking)
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

async function main() {
  // 1) Generate the consent URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',          // IMPORTANT: to get a refresh_token
    prompt: 'consent',               // force consent so refresh_token is returned
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this URL:\n');
  console.log(authUrl);
  console.log('\nWaiting for Google to redirect back to', GMAIL_REDIRECT_URI);

  // 2) Start a tiny HTTP server to catch the redirect with ?code=...
  const server = http.createServer(async (req, res) => {
    if (req.url.startsWith('/oauth2callback')) {
      const query = new URL(req.url, GMAIL_REDIRECT_URI).searchParams;
      const code = query.get('code');

      if (!code) {
        res.end('No code found in query string.');
        return;
      }

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        console.log('\nTokens received from Google:');
        console.log(JSON.stringify(tokens, null, 2));

        console.log('\nYour REFRESH TOKEN is:\n');
        console.log(tokens.refresh_token || '[no refresh_token returned]');
        console.log('\nSave this in .env as GMAIL_REFRESH_TOKEN');

        res.end('Authorization complete. You can close this tab.');
      } catch (err) {
        console.error('Error while trying to retrieve access token', err);
        res.end('Error retrieving access token. Check the console.');
      } finally {
        server.close();
      }
    } else {
      res.end('Not found');
    }
  });

  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`\nListening on http://localhost:${PORT}/ ...`);
  });
}

main().catch(console.error);
