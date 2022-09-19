"use strict";

import db from "../db";
import { BadRequestError, NotFoundError } from "../expressError";
import { sqlForPartialUpdate, sqlForFilters } from "../helpers/sql";

interface JobData {
  id?: number;
  title?: string | null;
  salary?: number | null;
  equity?: string | null;
  companyHandle?: string | null;
}

interface JobFilters {
  title?: string;
  minSalary?: number;
  hasEquity?: boolean;
}

/** Related functions for jobs. */

class Job {
  id?: number;
  title?: string;
  salary?: number;
  equity?: string;
  companyHandle?: string;

  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { handle, title, salary, equity, companyHandle }
   *
   * */

  static async create({
    title,
    salary,
    equity,
    companyHandle,
  }: JobData): Promise<Job> {
    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(filters?: JobFilters) {
    const mapping = {
      title: '"title" ILIKE',
      minSalary: '"salary" >',
      hasEquity: '"equity" > 0',
    };
    const filter = filters
      ? sqlForFilters(filters, mapping)
      : { str: "", values: [] };
    const queryString = `
      SELECT id,
        title,
        salary,
        equity,
        company_handle AS "companyHandle"
      FROM jobs
      ${filter.str}
      ORDER BY title`;
    console.log(queryString);
    const jobsRes = await db.query(queryString, filter.values);
    return jobsRes.rows;
  }

  /** Given a job handle, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id: number) {
    const jobRes = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id: number, data: JobData) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = $1
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id: number): Promise<void> {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);
  }
}

export default Job;
export type { JobFilters };
