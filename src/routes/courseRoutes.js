const express = require("express") ;
const router = express.Router() ;

// router.get("/" , (req,res) => {
//     res.json ({
//         message : "Get courses"
//     }) ;
// }) ;

const {getCourses , getCourseById, createCourse , updateCourse , deleteCourse} = require("../controllers/courseController");
const { getModulesByCourse } = require("../controllers/moduleController");


router.get("/", getCourses);

router.get("/:id", getCourseById) ;

router.post("/" , createCourse) ;
router.put("/:id" , updateCourse) ;
router.delete("/:id" , deleteCourse) ;

router.get("/:courseId/modules", getModulesByCourse);

module.exports = router ;