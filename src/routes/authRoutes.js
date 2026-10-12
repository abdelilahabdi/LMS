const express = require("express");
const router = express.Router();
 const auth = require("../middlewares/auth");
//const auth = require("../middlewares/auth");
//const authorize = require("../middlewares/authorize");

const { register , login , getMe } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth , getMe) ;

// router.get("/test-auth", auth, (req, res) => {
//     return res.status(200).json({
//         message: "Authentication successful",
//         user: req.user,
//     });
// });


// router.get(
//     "/test-learner",
//     auth,
//     authorize("learner"),
//     (req, res) => {
//         return res.status(200).json({
//             message: "Learner access granted",
//             user: req.user,
//         });
//     }
// );

// router.get(
//     "/test-admin",
//     auth,
//     authorize("admin"),
//     (req, res) => {
//         return res.status(200).json({
//             message: "Admin access granted",
//             user: req.user,
//         });
//     }
// );

module.exports = router;  //url