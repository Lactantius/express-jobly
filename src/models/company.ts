"use strict";

import db from "../db";
import { BadRequestError, NotFoundError } from "../expressError";
import { sqlForPartialUpdate, sqlForFilters } from "../helpers/sql";

interface CompanyData {
  handle?: string;
  name?: string | null;
  description?: string | null;
  numEmployees?: number | null;
  logoUrl?: string | null;
}

interface CompanyFilters {
  minEmployees?: number;
  maxEmployees?: number;
  name?: string;
}

/** Related functions for companies. */

class Company {
  handle?: string;
  name?: string;
  description?: string;
  numEmployees?: number;
  logoUrl?: string;

  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({
    handle,
    name,
    description,
    numEmployees,
    logoUrl,
  }: CompanyData) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters?: CompanyFilters) {
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
   *
   **/

  static async get(handle: string) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies AS c
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    // Could potentially do this is a single query with a join, but it would take a while figure out.
    const jobs = await db.query(
      `SELECT id,
              title,
              salary,
              equity
         FROM jobs
         WHERE company_handle = $1`,
      [handle]
    );
    company["jobs"] = jobs.rows;

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

  static async update(handle: string, data: CompanyData) {
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

export default Company;
export type { CompanyFilters };
