const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to store the token
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Set up Google OAuth2 Client with your credentials
const credentials = require('./credentials.json');
const { client_secret, client_id, redirect_uris } = credentials.installed;

// Create OAuth2 client
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Load the token from file (once the user authorizes)
function loadToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    const token = fs.readFileSync(TOKEN_PATH, 'utf-8');
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log('Token loaded successfully.');
  } else {
    console.log('Token not found. Please authenticate first.');
    getNewToken();
  }
}

// Get a new token if one is not found
function getNewToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],  // Scope for file upload
  });

  console.log('Authorize this app by visiting this URL:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', async (code) => {
    rl.close();
    try {
      // Get the tokens and set them
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      // Save the token to a file
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
      console.log('Token stored to', TOKEN_PATH);
    } catch (error) {
      console.error('Error while trying to retrieve access token', error);
    }
  });
}

module.exports = {
  oAuth2Client,
  loadToken,
};
