const express = require("express");
const courseRoutes = require("./routes/courseRoutes");
const resourceRotes = require("./routes/resourceRoutes");
const notFound = require("./middlewares/notFound");

const app = express();

app.use(express.json());
app.use("/api/courses", courseRoutes) ;
app.use("/api/modules", resourceRotes) ;
app.use(notFound);
module.exports = app;
