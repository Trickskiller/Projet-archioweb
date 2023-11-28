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

import mongoose from "mongoose";

import cors from "cors";
mongoose.connect(
  process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/ParkingLocationApp"
);

const app = express();
app.use(cors());

// Serve the apiDoc documentation.
const __dirname = path.resolve();
app.use("/apidoc", express.static(path.join(__dirname, "docs")));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter); // indexRouter est le routeur pour la racine de l'API (localhost:3000/) np
app.use("/users", usersRouter);
app.use("/vehicules", vehiculesRouter);
app.use("/places", placesRouter);
app.use("/reservations", reservationsRouter);
app.use("/login", loginRouter);


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
