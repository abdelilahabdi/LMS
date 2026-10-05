const Course = require("../models/Course");
const mongoose = require("mongoose");
const getCourses = async (req, res, next) => {
    try {

        const {category , level , keyword , sort} = req.query ;

        let filter = {
            status : "published"
        };

        if (category) {
            filter.category = category ;
        }

        if (level) {
            filter.level = level ;
        }
         
        if (keyword) {
            filter.$or = [
               {title : {$regex: keyword , $options: "i"}},
               {description : {$regex: keyword , $options : "i"}} 
            ];
        }
        const courses = await Course.find(filter).sort(sort) ;

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



const createCourse = async (req, res, next) => {
    try {
        const {
            title,
            description,
            category,
            level
        } = req.body;

        const course = await Course.create({
            title,
            description,
            category,
            level
        });

        res.status(201).json(course);
    } catch (error) {
        next(error);
    }
};


const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid course id"
            });
        }

        const course = await Course.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.status(200).json(course);
    } catch (error) {
        next(error);
    }
};



const deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid course id"
            });
        }

        const course = await Course.findByIdAndDelete(id);

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        res.status(200).json({
            message: "Course deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {getCourses , getCourseById , createCourse , updateCourse , deleteCourse};