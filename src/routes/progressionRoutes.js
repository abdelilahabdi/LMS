const express = require("express");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const {
    validateProgressionId,
    validateResourceId,
    validateProgressionInitialization,
    validateCompletionBody
} = require("../middlewares/progressionValidation");
const {
    getProgressions,
    getProgressionById,
    initializeProgression,
    completeResource
} = require("../controllers/progressionController");

const router = express.Router();
const learnerAccess = [auth, authorize("learner")];

router.get("/", ...learnerAccess, getProgressions);
router.get("/:id", ...learnerAccess, validateProgressionId, getProgressionById);
router.post("/", ...learnerAccess, validateProgressionInitialization, initializeProgression);
router.patch(
    "/:id/resources/:resourceId",
    ...learnerAccess,
    validateProgressionId,
    validateResourceId,
    validateCompletionBody,
    completeResource
);

module.exports = router;
