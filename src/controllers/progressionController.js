const Progress = require("../models/Progress");

const getProgressions = async (req, res, next) => {
    try {
        const progressions = await Progress.find({ student_id: req.user.id })
            .populate("course_id", "title description")
            .populate("enrollment_id")
            .populate("completed_resources", "title type module");

        return res.status(200).json({
            count: progressions.length,
            progressions
        });
    } catch (error) {
        return next(error);
    }
};

const getProgressionById = async (req, res, next) => {
    try {
        const progression = await Progress.findById(req.params.id)
            .populate("course_id", "title description")
            .populate("enrollment_id")
            .populate("completed_resources", "title type module");

        if (!progression) {
            return res.status(404).json({ message: "Progression not found" });
        }

        if (progression.student_id.toString() !== req.user.id) {
            return res.status(403).json({ message: "You cannot access this progression" });
        }

        return res.status(200).json({ progression });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getProgressions,
    getProgressionById
};
