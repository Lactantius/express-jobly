import bcrypt from "bcrypt";

import db from "../../src/db";
import { BCRYPT_WORK_FACTOR } from "../../src/config";

import Job from "../../src/models/job";

async function commonBeforeAll() {
  await db.query("DELETE FROM applications");
  await db.query("DELETE FROM jobs");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  await db.query(
    `
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
    ]
  );

  const jobs = await db.query(`
    INSERT INTO jobs(title, salary, equity, company_handle)
    VALUES ('J1', 50000, .05, 'c1'),
           ('J2', 60000, 0, 'c1'),
           ('J3', 70000, .1, 'c2')
    RETURNING id`);
  const [j1, j2, j3] = jobs.rows.map((job) => job.id);

  await db.query(`
    INSERT INTO applications(username, job_id)
      VALUES ('u1', ${j2}),
      ('u1', ${j3}),
      ('u2', ${j3})`);
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

interface StringIndexed {
  [index: string]: any;
}

const removeKey = (key: any) => (obj: StringIndexed) =>
  Object.keys(obj)
    .filter((k) => k !== key)
    .reduce((acc, k) => ((acc[k] = obj[k]), acc), <StringIndexed>{});

const removeId = removeKey("id");

async function job1(): Promise<number> {
  const jobs = await Job.findAll();
  return jobs[0].id;
}

export {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  removeId,
  job1,
};
