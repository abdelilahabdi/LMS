const express = require("express");

const {
    enrollment_create,
    enrollment_getAll,
    enrollment_getByStudent
} = require("../controllers/EnrollmentController");

const route = express.Router();

route.post("/enrollment", enrollment_create);

route.get("/enrollment", enrollment_getAll);

route.get("/enrollment/student/:studentId", enrollment_getByStudent);

module.exports = route;