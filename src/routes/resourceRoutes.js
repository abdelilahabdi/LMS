const express = require("express");
const router = express.Router();

const { getResourcesByModule } = require("../controllers/resourceController");

router.get("/:moduleId/resources", getResourcesByModule);

module.exports = router;