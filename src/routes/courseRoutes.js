const express = require("express") ;
const router = express.Router() ;

// router.get("/" , (req,res) => {
//     res.json ({
//         message : "Get courses"
//     }) ;
// }) ;

const {getCourses , getCourseById} = require("../controllers/courseController");
const { getModulesByCourse } = require("../controllers/moduleController");

router.get("/", getCourses);

router.get("/:id", getCourseById) ;

router.get("/:courseId/modules", getModulesByCourse);
module.exports = router ;