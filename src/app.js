const express = require("express");
const courseRoutes = require("./routes/courseRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/authRoutes");
const progressionRoutes = require("./routes/progressionRoutes");
const trainerRoutes = require('./routes/trainerRoutes');

const app = express();

// app.use((req, res, next) => {
//     console.log("[REQUEST]", req.method, req.path);
//     next();
// });


app.use(express.json());

const googleDriveRoutes = require("./routes/googleDriveRoutes");
app.use("/", googleDriveRoutes);


app.use("/api/courses", courseRoutes);
app.use("/api/modules", resourceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/progression", progressionRoutes);
app.use("/api/trainer", trainerRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const enrollment_route = require("./routes/enrollment_Routes");
app.use("/", enrollment_route);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
