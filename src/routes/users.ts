"use strict";

/** Routes for users. */

import jsonschema from "jsonschema";
import express from "express";

import User from "../models/user";
import { createToken } from "../helpers/tokens";
import { ensureAdminOrSameUser } from "../middleware/auth";

const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const userNewSchema = require("../../schemas/userNew.json");
const userUpdateSchema = require("../../schemas/userUpdate.json");

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, jobs: [ids] }
 *
 * Authorization required: admin or same user
 **/

router.get(
  "/:username",
  ensureAdminOrSameUser,
  async function (req, res, next) {
    try {
      const user = await User.get(req.params.username);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or same user
 **/

router.patch(
  "/:username",
  ensureAdminOrSameUser,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same user
 **/

router.delete(
  "/:username",
  ensureAdminOrSameUser,
  async function (req, res, next) {
    try {
      await User.remove(req.params.username);
      return res.json({ deleted: req.params.username });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;

/** POST /[username]/jobs[id] => { applied: jobId }
 *
 * Returns { applied: jobId }
 *
 * Authorization required: admin or same user
 **/

router.post(
  "/:username/jobs/:id",
  ensureAdminOrSameUser,
  async function (req, res, next) {
    try {
      const application = await User.apply(
        req.params.username,
        Number(req.params.id)
      );
      return res.json({ applied: Number(req.params.id) });
    } catch (err) {
      return next(err);
    }
  }
);
