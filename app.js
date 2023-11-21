import express from "express";
import createError from "http-errors";
import logger from "morgan";
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import mongoose from "mongoose";
import fs from "fs";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";
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

// app.use(function myMiddleware(req, res, next) {
//   console.log("Hello World!");
//   res.send("Hello World!");
//   next();
// });

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter); // indexRouter est le routeur pour la racine de l'API (localhost:3000/) np
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send the error status
  res.status(err.status || 500);
  res.send(err.message);
});

export default app;
