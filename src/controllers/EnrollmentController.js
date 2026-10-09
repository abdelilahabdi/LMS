const  enrollment = require('../models/Enrollment.js')
const  course = require("../models/Course.js");


const mongoose = require("mongoose");

const Status = require("../models/Status");

const enrollment_create = async (req, res) => {
    try {
        const { student_id, course_id } = req.body;

        if (!student_id || !course_id) 
        {
            return res.status(400).json(
            {
                message: "student_id and course_id are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(student_id))     
        {
            return res.status(400).json({
                message: "Invalid student_id"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(course_id)) 
        {
            return res.status(400).json({
                message: "Invalid course_id"
            });
        }

        const student = await User.findById(student_id);

        if (!student) 
        {
            return res.status(404).json(
            {
                message: "student not found"
            });
        }

        const course = await Course.findById(course_id);

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        if (!course.published) {
            return res.status(400).json({
                message: "This course is not published"
            });
        }

        const existingEnrollment = await Enrollment.findOne({
            student_id: student_id,
            course_id: course_id
        });

        if (existingEnrollment) {
            return res.status(409).json({
                message: "Student is already enrolled in this course"
            });
        }

        const status = await Status.findOne({
            status_name: "active"
        });

        if (!status) {
            return res.status(500).json({
                message: "Active status not found"
            });
        }

        // 8. Créer l'inscription
        const enrollment = await Enrollment.create({
            student_id: student_id,
            course_id: course_id,
            status_id: status._id,
            progress_percentage: 0
        });

        // 9. Réponse
        return res.status(201).json({
            message: "Student enrolled successfully",
            enrollment: enrollment
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    enrollment_create
};

// async function (


