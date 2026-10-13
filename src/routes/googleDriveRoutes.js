const express = require("express");
const router = express.Router();

const {
    oauth2Client,
    getAuthUrl,
    setCredentials,
    loadSavedCredentials,
    drive
} = require("../config/googleDrive");

// Load saved Google Drive tokens when the module starts.
loadSavedCredentials();

router.get("/auth", (req, res) => {
    res.redirect(getAuthUrl());
});

router.get("/oauth2callback", async (req, res, next) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).send("Authorization code is missing.");
        }

        const { tokens } = await oauth2Client.getToken(code);

        setCredentials(tokens);

        const result = await drive.about.get({
            fields: "user(displayName,emailAddress)"
        });

        res.json({
            success: true,
            message: "Google Drive connected successfully.",
            account: result.data.user
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;