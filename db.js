require('dotenv').config(); // Load .env file from the current directory (backend)

'use strict';

const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require("./shared/schema");

if (
  !process.env.DB_USER ||
  !process.env.DB_PASSWORD ||
  !process.env.DB_HOST ||
  !process.env.DB_PORT ||
  !process.env.DB_DATABASE
) {
  throw new Error(
    "DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, and DB_DATABASE must be set in environment variables. Did you forget to create or update your .env file?",
  );
}

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_DATABASE,
});

const db = drizzle(pool, { schema });

module.exports = { pool, db };