const express = require("express");
const router = express.Router();

const {
    getModulesByCourse,
    create_module,
    get_all_modules,
    get_module_by_id,
    update_module,
    delete_module } = require("../controllers/moduleController");

router.post("/", create_module);

router.get("/", get_all_modules);

router.get("/:id", get_module_by_id);

router.put("/:id", update_module);

router.delete("/:id", delete_module);

module.exports = router;