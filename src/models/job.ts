"use strict";

import db from "../db";
import { BadRequestError, NotFoundError } from "../expressError";
import { sqlForPartialUpdate, sqlForFilters } from "../helpers/sql";

interface JobData {
  id?: number;
  title?: string;
  salary?: number;
  equity?: string;
  companyHandle?: string;
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

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters?: JobFilters) {
    const mapping = {
      minEmployees: '"num_employees" >=',
      maxEmployees: '"num_employees" <=',
      name: '"name" ILIKE',
    };
    const filter = filters
      ? sqlForFilters(filters, mapping)
      : { str: "", values: [] };
    const queryString = `
      SELECT handle,
        name,
        description,
        num_employees AS "numEmployees",
        logo_url AS "logoUrl"
      FROM companies
      ${filter.str}
      ORDER BY name`;
    console.log(queryString);
    const companiesRes = await db.query(queryString, filter.values);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle: string) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle: string, data: JobData) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle: string) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

export default Job;
export type { JobFilters };
