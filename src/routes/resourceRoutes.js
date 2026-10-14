const express = require("express");
const router = express.Router();
const canAccessCourseContent = require("../middlewares/canAccessCourseContent") ;

const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");


const {
    getResourcesByModule,
    uploadResource
} = require("../controllers/resourceController");

const { resourceUpload } = require("../middlewares/resourceUpload");



 


/**
 * @swagger
 * /api/modules/{moduleId}/resources:
 *   get:
 *     summary: Get resources of a module
 *     tags:
 *       - Resources
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resources retrieved successfully
 *       400:
 *         description: Invalid module ID
 *       500:
 *         description: Internal server error
 *
 *   post:
 *     summary: Upload a resource to a module
 *     tags:
 *       - Resources
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - file
 *             properties:
 *               title:
 *                 type: string
 *                 example: JavaScript Introduction
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Resource uploaded successfully
 *       400:
 *         description: Invalid file or request data
 *       404:
 *         description: Module not found
 *       500:
 *         description: Internal server error
 */

router.get(
    "/:moduleId/resources",
    auth,
    canAccessCourseContent,
    getResourcesByModule
);


router.post(
    "/:moduleId/resources",
    auth,
    authorize("trainer", "admin"),
    resourceUpload.single("file"),
    uploadResource
);




module.exports = router;