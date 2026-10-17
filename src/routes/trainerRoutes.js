const express = require("express");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { getEnrolled, getLearnerProgression } = require("../controllers/trainerController");

const router = express.Router();

router.get("/enrolled", auth, authorize("trainer", "admin"), getEnrolled);
router.get("/progression/:studentId/:courseId", auth, authorize("trainer", "admin"), getLearnerProgression);

module.exports = router;

/**
 * @swagger
 * /api/trainer/enrolled:
 *   get:
 *     summary: List learners enrolled in trainer's courses
 *     tags: [Trainer]
 *     responses:
 *       200: { description: Enrolled learners }
 * /api/trainer/progression/{studentId}/{courseId}:
 *   get:
 *     summary: View learner progression
 *     tags: [Trainer]
 */
