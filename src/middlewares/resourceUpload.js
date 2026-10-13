const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const filename = `${crypto.randomUUID()}${extension}`;
        cb(null, filename);
    }
});

const allowedTypes = {
    "application/pdf": [".pdf"],

    "video/mp4": [".mp4"],
    "video/webm": [".webm"],

    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"]
};
const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const extensions = allowedTypes[file.mimetype];

    if (!extensions || !extensions.includes(extension)) {
        return cb(new Error("Only PDF, MP4 and WebM files are allowed."));
    }

    cb(null, true);
};

const resourceUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

module.exports = {resourceUpload , UPLOAD_DIR: uploadDir};