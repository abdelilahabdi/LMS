const { google } = require("googleapis");

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
};

const drive = google.drive({
    version: "v3",
    auth: oauth2Client
});

module.exports = {
    oauth2Client,
    getAuthUrl,
    setCredentials,
    drive
};