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


const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

module.exports = {getCourses , getCourseById};