const express = require("express");
const courseRoutes = require("./routes/courseRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/authRoutes");
const progressionRoutes = require("./routes/progressionRoutes");
const trainerRoutes = require("./routes/trainerRoutes");
const googleDriveRoutes = require("./routes/googleDriveRoutes");
const enrollmentRoutes = require("./routes/enrollment_Routes");

const app = express();

app.use(express.json());

app.use("/", googleDriveRoutes);

app.use("/api/courses", courseRoutes);
app.use("/api/modules", resourceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/progression", progressionRoutes);
app.use("/api/trainer", trainerRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/", enrollmentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;