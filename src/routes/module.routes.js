const express = require("express");
const router = express.Router();

const {getModulesByCourse, create_module } = require("../controllers/moduleController");


router.post("/", create_module);

module.exports = router;