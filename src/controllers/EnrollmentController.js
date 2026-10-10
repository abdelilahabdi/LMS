const Enrollment = require("../models/Enrollment.js");
const Course = require("../models/Course.js");
const User = require("../models/User.js");
const Status = require("../models/Status.js");
const mongoose = require("mongoose");

const enrollment_create = async (req, res) => {
    try {
        const { student_id, course_id } = req.body;

        if (!student_id || !course_id) {
            return res.status(400).json({
                message: "student_id and course_id are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(student_id)) {
            return res.status(400).json({
                message: "Invalid student_id"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(course_id)) {
            return res.status(400).json({
                message: "Invalid course_id"
            });
        }

        const student = await User.findById(student_id);

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const foundCourse = await Course.findById(course_id);

        if (!foundCourse) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        if (foundCourse.status !== "published") 
        {
            return res.status(400).json({
             message: "This course is not published"
         });
        }

        const existingEnrollment = await Enrollment.findOne({
            student_id,
            course_id
        });

        if (existingEnrollment) {
            return res.status(409).json({
                message: "Student is already enrolled in this course"
            });
        }

        const activeStatus = await Status.findOne({
            status_name: "active"
        });

        if (!activeStatus) {
            return res.status(500).json({
                message: "Active status not found"
            });
        }

        const newEnrollment = await Enrollment.create({
            student_id,
            course_id,
            status_id: activeStatus._id,
            progress_percentage: 0
        });

        return res.status(201).json({
            message: "Student enrolled successfully",
            enrollment: newEnrollment
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    enrollment_create
};