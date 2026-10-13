const mongoose = require("mongoose");

const Course = require("../models/Course");
const Module = require("../models/Module");
const Enrollment = require ("../models/Enrollment") ;
const Status = require("../models/Status") ;



const canAccessCourseContent = async (req,res,next) => {
    try {
        let courseId = req.params.courseId ;


        if (req.params.moduleId) {
            const {moduleId} = req.params ;
        

        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({
                message: "invalaid module id" ,
            }) ;
        }



        const module = await Module.findById(moduleId).select("course") ;

        if (!module) {
            return res.status(404).json({
                message: "module not fouund" ,
            }) ;
        }

        courseId = module.course ;
    
    }

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({
            message : "invalid course id" ,
        }) ;
    }

    const course = await Course.findById(courseId) ;


    if (!course) {
        return res.status(404).json({
            message : "course not found" ,
        });
    }


    if (req.user.role === "admin") {
        req.course = course ;
        return next () ;
    }




    if (req.user.role === "trainer") {
        return res.status(403).json({
            message : "trainer ownership validation is not configured" ,
        });
    }

    if (req.user.role !== "learner") {
        return res.status(403).json({
            message : "you de not have permission to acces this content" ,
        });
    }




    if(course.status !== "published") {
        return res.status(403).json({
            message: "this course is not available" ,
        }) ;
    }



    const enrollment = await Enrollment.findOne({
        student_id : req.user.id ,
        course_id: course._id ,
    }) ;


    if (!enrollment) {
        return res.status(403).json({
            message : "you must be enrolled in this course" ,
        }) ;
    }


    const enrollmentStatus = await Status.findById(
        enrollment.status_id
    );


    if (!enrollmentStatus || enrollmentStatus.status_name !== "active") {
        return res.status(403).json({
            message : "an active enrollment is required" ,
        }) ;
    }

    req.course = course ;
    return next() ;
} catch (error) {
    next(error) ;
}

};

module.exports = canAccessCourseContent ;