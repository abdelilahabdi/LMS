const express = require("express");
const router = express.Router();

const {get_module_by_id, create_module ,get_all_modules} = require("../controllers/moduleController");


router.post("/", create_module);

// router.get('/:id',getModulesByCourse);
router.get('/:id', get_module_by_id);
router.get("/", get_all_modules);
module.exports = router;