const Course = require("../models/Course");
const mongoose = require("mongoose");
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

    
    if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
        message: "Invalid course id"
    });
}

    const course = await Course.findById(id);

   if (!course) {
    return res.status(404).json({
        message : "Course not found"
    }) ;

   }


    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

module.exports = {getCourses , getCourseById};