const express = require("express");
const courseRoutes = require("./routes/courseRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());

const googleDriveRoutes = require("./routes/googleDriveRoutes");
app.use("/", googleDriveRoutes);


app.use("/api/courses", courseRoutes);
app.use("/api/modules", resourceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const enrollment_route = require("./routes/enrollment_Routes");
app.use("/", enrollment_route);

app.use(notFound);
app.use(errorHandler);

module.exports = app;