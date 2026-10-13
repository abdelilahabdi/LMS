const express = require("express");
const router = express.Router();

const {getModulesByCourse, create_module ,get_all_modules} = require("../controllers/moduleController");


router.post("/", create_module);

router.get('/:id',getModulesByCourse);

router.get("/", get_all_modules);
module.exports = router;