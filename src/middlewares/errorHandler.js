const multer = require("multer");

const errorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    if (err.message === "Only PDF, MP4 and WebM files are allowed.") {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    console.error(err);

    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
};

module.exports = errorHandler;