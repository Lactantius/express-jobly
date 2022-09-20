"use strict";

import request from "supertest";

import db from "../../src/db";
import app from "../../src/app";

import {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  adminToken,
  u1Token,
  job1,
} from "./_testCommon";

import { removeId } from "../models/_testCommon";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 100,
    equity: 0.01,
    companyHandle: "c1",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(removeId(resp.body.job)).toEqual({
      title: "new",
      salary: 100,
      equity: "0.01",
      companyHandle: "c1",
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app).post("/jobs").send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("forbidden for non-admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 10,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "none",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    const noIds = resp.body.jobs.map(removeId);
    expect({ jobs: noIds }).toEqual({
      jobs: [
        {
          title: "J1",
          salary: 50000,
          equity: "0.05",
          company: {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
        },
        {
          title: "J2",
          salary: 60000,
          equity: "0",
          company: {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
        },
        {
          title: "J3",
          salary: 70000,
          equity: "0.1",
          company: {
            handle: "c2",
            name: "C2",
            description: "Desc2",
            numEmployees: 2,
            logoUrl: "http://c2.img",
          },
        },
      ],
    });
  });

  test("title filter for jobs", async function () {
    const resp = await request(app).get("/jobs").send({ title: "1" });
    expect(resp.statusCode).toBe(200);
    const noIds = resp.body.jobs.map(removeId);
    expect({ jobs: noIds }).toEqual({
      jobs: [
        {
          title: "J1",
          salary: 50000,
          equity: "0.05",
          company: {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
        },
      ],
    });
  });

  test("hasEquity filter for jobs", async function () {
    const resp = await request(app).get("/jobs").send({ hasEquity: true });
    expect(resp.statusCode).toBe(200);
    const noIds = resp.body.jobs.map(removeId);
    expect({ jobs: noIds }).toEqual({
      jobs: [
        {
          title: "J1",
          salary: 50000,
          equity: "0.05",
          company: {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
        },
        {
          title: "J3",
          salary: 70000,
          equity: "0.1",
          company: {
            handle: "c2",
            name: "C2",
            description: "Desc2",
            numEmployees: 2,
            logoUrl: "http://c2.img",
          },
        },
      ],
    });
  });

  test("minSalary filter for jobs", async function () {
    const resp = await request(app).get("/jobs").send({ minSalary: 65000 });
    expect(resp.statusCode).toBe(200);
    const noIds = resp.body.jobs.map(removeId);
    expect({ jobs: noIds }).toEqual({
      jobs: [
        {
          title: "J3",
          salary: 70000,
          equity: "0.1",
          company: {
            handle: "c2",
            name: "C2",
            description: "Desc2",
            numEmployees: 2,
            logoUrl: "http://c2.img",
          },
        },
      ],
    });
  });

  test("multiple filters for jobs", async function () {
    const resp = await request(app)
      .get("/jobs")
      .send({ minSalary: 65000, hasEquity: true });
    expect(resp.statusCode).toBe(200);
    const noIds = resp.body.jobs.map(removeId);
    expect({ jobs: noIds }).toEqual({
      jobs: [
        {
          title: "J3",
          salary: 70000,
          equity: "0.1",
          company: {
            handle: "c2",
            name: "C2",
            description: "Desc2",
            numEmployees: 2,
            logoUrl: "http://c2.img",
          },
        },
      ],
    });
  });

  test("reject invalid filters", async function () {
    const resp = await request(app).get("/jobs").send({ hack: "your app" });
    expect(resp.statusCode).toBe(400);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const id = await job1();
    const resp = await request(app).get(`/jobs/${id}`);
    const noId = removeId(resp.body.job);
    expect({ job: noId }).toEqual({
      job: {
        title: "J1",
        salary: 50000,
        equity: "0.05",
        company: {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:handle", function () {
  test("works for users", async function () {
    const id = await job1();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "J1-new",
      })
      .set("authorization", `Bearer ${adminToken}`);
    const noId = removeId(resp.body.job);
    expect({ job: noId }).toEqual({
      job: {
        title: "J1-new",
        salary: 50000,
        equity: "0.05",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    const id = await job1();
    const resp = await request(app).patch(`/jobs/${id}`).send({
      title: "J1-new",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("forbidden for non-admin", async function () {
    const id = await job1();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "J1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const id = await job1();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        id: 9000,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const id = await job1();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {
    const id = await job1();
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toBe(200);
  });

  test("unauth for anon", async function () {
    const id = await job1();
    const resp = await request(app).delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("forbidden for non-admin", async function () {
    const id = await job1();
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(403);
  });

  test("not found for no such company", async function () {
    const id = await job1();
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
