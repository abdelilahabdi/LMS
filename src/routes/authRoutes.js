const express = require("express");
const router = express.Router();
// const auth = require("../middlewares/auth");


const { register , login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);


// router.get("/test-auth", auth, (req, res) => {
//     return res.status(200).json({
//         message: "Authentication successful",
//         user: req.user,
//     });
// });


module.exports = router;  //url