const express = require("express");
const router = express.Router();

const { getResourcesByModule } = require("../controllers/resourceController");

/**
 * @swagger
 * /api/modules/{moduleId}/resources:
 *   get:
 *     summary: Get resources of a module
 *     description: Return all resources belonging to a specific module.
 *     tags:
 *       - Resources
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *     responses:
 *       200:
 *         description: List of resources
 *       400:
 *         description: Invalid module ID
 *       500:
 *         description: Internal server error
 */
router.get("/:moduleId/resources", getResourcesByModule);

module.exports = router;