"use strict";

/** Routes for jobs. */

import jsonschema from "jsonschema";
import { Router } from "express";

import Job from "../models/job";
import { BadRequestError } from "../expressError";
import { ensureLoggedIn, ensureAdmin } from "../middleware/auth";

const jobNewSchema = require("../../schemas/jobNew.json");
const jobUpdateSchema = require("../../schemas/jobUpdate.json");
const jobSearchSchema = require("../../schemas/jobSearch.json");

const router = Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs.join(", "));
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, {...company} }, ...] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs.join(", "));
    }
    // There's probably a way to do this in the schema, but it was non-obvious
    const jobs = await Job.findAll(req.body);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  =>  { job }
 *
 *  Jobs is [{ id, title, salary, equity, ...company }, ...]
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(Number(req.params.id));
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity, companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs.join(", "));
    }

    const job = await Job.update(Number(req.params.id), req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(Number(req.params.id));
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

export default router;
