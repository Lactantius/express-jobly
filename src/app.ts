"use strict";

/** Express app for jobly. */

import express, { NextFunction } from "express";
import cors from "cors";

const { NotFoundError } = require("./expressError");

const { authenticateJWT } = require("./middleware/auth");
import authRoutes from "./routes/auth";
import companiesRoutes from "./routes/companies";
import usersRoutes from "./routes/users";

import morgan from "morgan";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);

app.use("/auth", authRoutes);
app.use("/companies", companiesRoutes);
app.use("/users", usersRoutes);

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err: ExpressError, req: any, res: any, next: NextFunction) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

export default app;
