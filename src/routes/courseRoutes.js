const express = require("express") ;
const router = express.Router() ;

// router.get("/" , (req,res) => {
//     res.json ({
//         message : "Get courses"
//     }) ;
// }) ;

const {getCourses , getCourseById} = require("../controllers/courseController");

router.get("/", getCourses);

router.get("/:id", getCourseById) ;
module.exports = router ;