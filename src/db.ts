"use strict";
/** Database setup for jobly. */
import { Client } from "pg";
import { getDatabaseUri } from "./config";

const db = initDB(process.env.NODE_ENV);

function initDB(env: string | unknown) {
  const dbOptions =
    env === "production"
      ? {
        connectionString: getDatabaseUri(),
        ssl: { rejectUnauthorized: false },
      }
      : { connectionString: getDatabaseUri() };
  const newDB = new Client(dbOptions);
  newDB.connect();
  return newDB;
}

export default db;
