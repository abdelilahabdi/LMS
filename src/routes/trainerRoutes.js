const express = require("express");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const Course = require("../models/Course");

const router = express.Router();

const getEnrolled = async (req, res, next) => {
    try {
        const trainerId = req.user.id;
        const courses = await Course.find({ trainer: trainerId }).select("_id");
        const courseIds = courses.map((c) => c._id);
        const enrollments = await Enrollment.find({ course_id: { $in: courseIds } })
            .populate("student_id", "name email")
            .populate("course_id", "title");
        return res.status(200).json({ count: enrollments.length, enrollments });
    } catch (error) {
        next(error);
    }
};

const getLearnerProgression = async (req, res, next) => {
    try {
        const { studentId, courseId } = req.params;
        const trainerId = req.user.id;
        const course = await Course.findOne({ _id: courseId, trainer: trainerId });
        if (!course) return res.status(403).json({ message: "Not your course" });
        const progression = await Progress.findOne({ student_id: studentId, course_id: courseId })
            .populate("enrollment_id")
            .populate("completed_resources", "title");
        if (!progression) return res.status(404).json({ message: "Progression not found" });
        return res.status(200).json({ progression });
    } catch (error) {
        next(error);
    }
};

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
