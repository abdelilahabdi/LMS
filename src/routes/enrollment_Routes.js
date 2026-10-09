const express =  require('express');
const {enrollment_create} = require('../controllers/EnrollmentController');


const  route =  express.Router();

route.post('/enrollment',enrollment_create)
module.exports = route; 