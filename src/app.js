const express = require("express");
const courseRoutes = require("./routes/courseRoutes");
const app = express();

app.use(express.json());
app.use("/api/courses", courseRoutes) ;

module.exports = app;
