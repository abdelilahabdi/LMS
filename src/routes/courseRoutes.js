const express = require("express") ;
const router = express.Router() ;

// router.get("/" , (req,res) => {
//     res.json ({
//         message : "Get courses"
//     }) ;
// }) ;

const {getCourses} = require("../controllers/courseController");

router.get("/", getCourses);

module.exports = router ;