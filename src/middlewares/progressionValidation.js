const mongoose = require("mongoose");

const invalidId = (value) => !mongoose.Types.ObjectId.isValid(value);

const validateProgressionId = (req, res, next) => {
    if (invalidId(req.params.id)) {
        return res.status(400).json({ message: "Invalid progression ID" });
    }

    return next();
};

const validateResourceId = (req, res, next) => {
    if (invalidId(req.params.resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
    }

    return next();
};

const validateProgressionInitialization = (req, res, next) => {
    const body = req.body;
    const keys = body && typeof body === "object" && !Array.isArray(body)
        ? Object.keys(body)
        : [];

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({ message: "A JSON object is required" });
    }

    if (keys.some((key) => key !== "enrollment_id")) {
        return res.status(400).json({ message: "Only enrollment_id may be provided" });
    }

    if (!body.enrollment_id || invalidId(body.enrollment_id)) {
        return res.status(400).json({ message: "A valid enrollment_id is required" });
    }

    return next();
};

const validateCompletionBody = (req, res, next) => {
    const body = req.body;
    if (body && typeof body === "object" && !Array.isArray(body) && Object.keys(body).length > 0) {
        return res.status(400).json({ message: "Completion does not accept request fields" });
    }

    return next();
};

module.exports = {
    validateProgressionId,
    validateResourceId,
    validateProgressionInitialization,
    validateCompletionBody
};
