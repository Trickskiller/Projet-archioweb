import express from "express";
import createError from "http-errors";
import logger from "morgan";
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import vehiculesRouter from "./routes/vehicules.js";
import loginRouter from "./routes/login.js";
import placesRouter from "./routes/places.js";
import reservationsRouter from "./routes/reservations.js";
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import cors from "cors";

mongoose.connect(
  process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/ParkingLocationApp"
);

const app = express();
app.use(cors());

// Parse the OpenAPI document.
const openApiDocument = yaml.load(fs.readFileSync("./openapi.yml"));

// Serve the Swagger UI documentation.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Serve the apiDoc documentation.
const __dirname = path.resolve();
app.use("/apidoc", express.static(path.join(__dirname, "docs")));

// Define Swagger JSDoc options.
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Your API",
      version: "1.0.0",
    },
  },
  // Specify the paths to your route files
  apis: [
    "./routes/index.js",
    "./routes/users.js",
    "./routes/vehicules.js",
    "./routes/login.js",
    "./routes/places.js",
    "./routes/reservations.js",
  ],
};

// Initialize Swagger JSDoc with options.
const specs = swaggerJsdoc(options);

// Use Swagger UI with the generated Swagger JSDoc.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/vehicules", vehiculesRouter);
app.use("/places", placesRouter);
app.use("/reservations", reservationsRouter);
app.use("/login", loginRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.send(err.message);
});

export default app;
