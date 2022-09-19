"use strict";

import { NotFoundError, BadRequestError } from "../../src/expressError";
import db from "../../src/db";
import Company from "../../src/models/company";
import Job from "../../src/models/job";
import {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  removeId,
} from "./_testCommon";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

async function job1(): Promise<number> {
  const jobs = await Job.findAll();
  return jobs[0].id;
}

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "Paper Pusher",
    salary: 100000,
    equity: "0.1",
    companyHandle: "c3",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job.title).toEqual(newJob.title);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'Paper Pusher'`
    );
    expect(result.rows).toEqual([newJob]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    const jobs = await Job.findAll();
    const noIds = jobs.map(removeId);
    expect(noIds).toEqual([
      {
        title: "J1",
        salary: 50000,
        equity: "0.05",
        company: {
          description: "Desc1",
          handle: "c1",
          logoUrl: "http://c1.img",
          name: "C1",
          numEmployees: 1,
        },
      },
      {
        title: "J2",
        salary: 60000,
        equity: "0",
        company: {
          description: "Desc1",
          handle: "c1",
          logoUrl: "http://c1.img",
          name: "C1",
          numEmployees: 1,
        },
      },
      {
        title: "J3",
        salary: 70000,
        equity: "0.1",
        company: {
          description: "Desc2",
          handle: "c2",
          logoUrl: "http://c2.img",
          name: "C2",
          numEmployees: 2,
        },
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const id = await job1();
    let job = await Job.get(id);
    expect(removeId(job)).toEqual({
      title: "J1",
      salary: 50000,
      equity: "0.05",
      company: {
        description: "Desc1",
        handle: "c1",
        logoUrl: "http://c1.img",
        name: "C1",
        numEmployees: 1,
      },
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 900000,
    equity: "0.5",
    companyHandle: "c3",
  };

  test("works", async function () {
    const id = await job1();
    let job = await Job.update(id, updateData);
    expect(removeId(job)).toEqual({
      ...updateData,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${id};`
    );
    expect(result.rows.map(removeId)).toEqual([
      {
        title: "New",
        salary: 900000,
        equity: "0.5",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
      companyHandle: "c2",
    };

    const id = await job1();
    let job = await Job.update(id, updateDataSetNulls);
    expect(removeId(job)).toEqual({
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${id};`
    );
    expect(result.rows.map(removeId)).toEqual([
      {
        title: "New",
        salary: null,
        equity: null,
        companyHandle: "c2",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    const id = await job1();
    try {
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const id = await job1();
    const jobs = await Job.remove(id);
    const res = await db.query(`SELECT id FROM jobs WHERE id=${id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
