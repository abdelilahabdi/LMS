const express = require("express") ;
const router = express.Router() ;

// router.get("/" , (req,res) => {
//     res.json ({
//         message : "Get courses"
//     }) ;
// }) ;

const {getCourses , getCourseById, createCourse , updateCourse , deleteCourse} = require("../controllers/courseController");
const { getModulesByCourse } = require("../controllers/moduleController");

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all published courses
 *     description: Return all published courses.
 *     tags:
 *       - Courses
 *     responses:
 *       200:
 *         description: List of published courses
 */

router.get("/", getCourses);


/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     description: Return one course by its ID.
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course found
 *       400:
 *         description: Invalid course ID
 *       404:
 *         description: Course not found
 */
router.get("/:id", getCourseById) ;

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a course
 *     description: Create a new course. This route simulates a formateur action without authentication.
 *     tags:
 *       - Courses
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - level
 *             properties:
 *               title:
 *                 type: string
 *                 example: MongoDB Fundamentals
 *               description:
 *                 type: string
 *                 example: Learn MongoDB and Mongoose basics.
 *               category:
 *                 type: string
 *                 example: Database
 *               level:
 *                 type: string
 *                 enum:
 *                   - beginner
 *                   - intermediate
 *                   - advanced
 *                 example: beginner
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Invalid course data
 *       500:
 *         description: Internal server error
 */
router.post("/" , createCourse) ;

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course
 *     description: Update an existing course. This route simulates a formateur action without authentication.
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: MongoDB Fundamentals Updated
 *               description:
 *                 type: string
 *                 example: Learn MongoDB and Mongoose basics.
 *               category:
 *                 type: string
 *                 example: Database
 *               level:
 *                 type: string
 *                 enum:
 *                   - beginner
 *                   - intermediate
 *                   - advanced
 *                 example: intermediate
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Invalid course ID
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */

router.put("/:id" , updateCourse) ;

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     description: Delete an existing course. This route simulates a formateur action without authentication.
 *     tags:
 *       - Courses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       400:
 *         description: Invalid course ID
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id" , deleteCourse) ;

/**
 * @swagger
 * /api/courses/{courseId}/modules:
 *   get:
 *     summary: Get modules of a course
 *     description: Return all modules belonging to a specific course.
 *     tags:
 *       - Modules
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: List of modules
 *       400:
 *         description: Invalid course ID
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.get("/:courseId/modules", getModulesByCourse);

module.exports = router ;