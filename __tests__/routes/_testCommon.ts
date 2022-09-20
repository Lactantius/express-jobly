"use strict";

import request from "supertest";
import app from "../../src/app";
import db from "../../src/db";
import User from "../../src/models/user";
import Company from "../../src/models/company";
import Job from "../../src/models/job";
import { createToken } from "../../src/helpers/tokens";

async function commonBeforeAll() {
  await db.query("DELETE FROM applications");
  await db.query("DELETE FROM jobs");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await Company.create({
    handle: "c1",
    name: "C1",
    numEmployees: 1,
    description: "Desc1",
    logoUrl: "http://c1.img",
  });
  await Company.create({
    handle: "c2",
    name: "C2",
    numEmployees: 2,
    description: "Desc2",
    logoUrl: "http://c2.img",
  });
  await Company.create({
    handle: "c3",
    name: "C3",
    numEmployees: 3,
    description: "Desc3",
    logoUrl: "http://c3.img",
  });

  await User.register({
    username: "admin",
    firstName: "Admin",
    lastName: "Adminson",
    email: "admin@user.com",
    password: "admin1",
    isAdmin: true,
  });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });

  await Job.create({
    title: "J1",
    salary: 50000,
    equity: "0.05",
    companyHandle: "c1",
  });
  await Job.create({
    title: "J2",
    salary: 60000,
    equity: "0",
    companyHandle: "c1",
  });
  await Job.create({
    title: "J3",
    salary: 70000,
    equity: "0.1",
    companyHandle: "c2",
  });
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const adminToken = createToken({ username: "admin", isAdmin: true });
const u1Token = createToken({ username: "u1", isAdmin: false });

async function job1(): Promise<number> {
  const resp = await request(app).get("/jobs");
  return resp.body.jobs[0].id;
}

export {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  adminToken,
  u1Token,
  job1,
};
