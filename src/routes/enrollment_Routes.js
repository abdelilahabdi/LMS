const express =  require('express');
const {enrollment_create , enrollment_getAll} = require('../controllers/EnrollmentController');


const  route =  express.Router();

route.post('/enrollment',enrollment_create);
route.get('/enrollment',enrollment_getAll);
module.exports = route; 