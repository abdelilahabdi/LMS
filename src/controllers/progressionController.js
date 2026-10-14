const Progress = require("../models/Progress");
const Enrollment = require("../models/Enrollment");
const Status = require("../models/Status");
const Resource = require("../models/Resource");
const Module = require("../models/Module");

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

const initializeProgression = async (req, res, next) => {
    try {
        const enrollment = await Enrollment.findOne({
            _id: req.body.enrollment_id,
            student_id: req.user.id
        });

        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }

        const status = await Status.findById(enrollment.status_id);
        if (!status || status.status_name !== "active") {
            return res.status(403).json({ message: "An active enrollment is required" });
        }

        let progression = await Progress.findOne({
            student_id: req.user.id,
            course_id: enrollment.course_id
        });

        if (progression) {
            if (progression.enrollment_id && progression.enrollment_id.toString() !== enrollment.id) {
                return res.status(409).json({ message: "Progression already exists for this course" });
            }

            if (!progression.enrollment_id) {
                progression.enrollment_id = enrollment._id;
                await progression.save();
            }

            return res.status(200).json({ progression, initialized: false });
        }

        progression = await Progress.create({
            student_id: req.user.id,
            enrollment_id: enrollment._id,
            course_id: enrollment.course_id,
            completed_resources: [],
            completed: false,
            completed_at: null
        });

        return res.status(201).json({ progression, initialized: true });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Progression already exists for this enrollment" });
        }

        return next(error);
    }
};

const completeResource = async (req, res, next) => {
    try {
        const progression = await Progress.findOne({
            _id: req.params.id,
            student_id: req.user.id
        });

        if (!progression) {
            return res.status(404).json({ message: "Progression not found" });
        }

        const enrollment = await Enrollment.findOne({
            _id: progression.enrollment_id,
            student_id: req.user.id,
            course_id: progression.course_id
        });
        if (!enrollment) {
            return res.status(403).json({ message: "A matching enrollment is required" });
        }

        const status = await Status.findById(enrollment.status_id);
        if (!status || status.status_name !== "active") {
            return res.status(403).json({ message: "An active enrollment is required" });
        }

        const resource = await Resource.findById(req.params.resourceId);
        if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
        }

        const module = await Module.findById(resource.module);
        if (!module || module.course.toString() !== progression.course_id.toString()) {
            return res.status(400).json({ message: "Resource does not belong to this course" });
        }

        const alreadyCompleted = progression.completed_resources.some(
            (completedResourceId) => completedResourceId.toString() === resource.id
        );
        if (alreadyCompleted) {
            return res.status(409).json({ message: "Resource is already completed" });
        }

        const update = await Progress.updateOne(
            {
                _id: progression._id,
                completed_resources: { $ne: resource._id }
            },
            { $addToSet: { completed_resources: resource._id } }
        );

        if (update.modifiedCount === 0) {
            return res.status(409).json({ message: "Resource is already completed" });
        }

        const moduleIds = await Module.find({ course: progression.course_id }).distinct("_id");
        const requiredResources = await Resource.find({ module: { $in: moduleIds } }).select("_id");
        const requiredResourceIds = new Set(requiredResources.map((item) => item._id.toString()));
        const latestProgression = await Progress.findById(progression._id);
        const completedCount = latestProgression.completed_resources.filter(
            (completedResourceId) => requiredResourceIds.has(completedResourceId.toString())
        ).length;
        const progressPercentage = requiredResources.length === 0
            ? 0
            : Math.min(100, Math.max(0, Math.floor((completedCount / requiredResources.length) * 100)));
        const isComplete = requiredResources.length > 0 && completedCount === requiredResources.length;

        latestProgression.completed = isComplete;
        latestProgression.completed_at = isComplete
            ? (latestProgression.completed_at || new Date())
            : null;
        await latestProgression.save();

        enrollment.progress_percentage = isComplete ? 100 : progressPercentage;
        await enrollment.save();

        return res.status(200).json({
            progression: latestProgression,
            progress_percentage: enrollment.progress_percentage
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getProgressions,
    getProgressionById,
    initializeProgression,
    completeResource
};
