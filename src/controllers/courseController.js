const Course = require("../models/Course");

const getCourses = async (req, res, next) => {
    try {
        const courses = await Course.find({
            status: "published"
        });

        res.status(200).json(courses);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCourses
};