const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const TOKEN_PATH = path.join(__dirname, "../../.google-drive-tokens.json");

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
    "https://www.googleapis.com/auth/drive.file"
];

const getAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent"
    });
};

const setCredentials = (tokens) => {
    oauth2Client.setCredentials(tokens);

    let savedTokens = {};

    if (fs.existsSync(TOKEN_PATH)) {
        savedTokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    }

    const mergedTokens = {
        ...savedTokens,
        ...tokens
    };

    fs.writeFileSync(
        TOKEN_PATH,
        JSON.stringify(mergedTokens, null, 2),
        { mode: 0o600 }
    );

    oauth2Client.setCredentials(mergedTokens);
};

const loadSavedCredentials = () => {
    if (!fs.existsSync(TOKEN_PATH)) {
        return false;
    }

    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    oauth2Client.setCredentials(tokens);

    return true;
};

const drive = google.drive({
    version: "v3",
    auth: oauth2Client
});

module.exports = {
    oauth2Client,
    getAuthUrl,
    setCredentials,
    loadSavedCredentials,
    drive
};