import fs from 'fs/promises';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MAX_RETRIES = 12;
const RETRY_DELAY_MS = 2500;

async function waitForDb() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
      });
      await conn.query('SELECT 1');
      await conn.end();
      console.log('Connected to MySQL database.');
      return;
    } catch (err) {
      console.error(`MySQL connection attempt ${attempt} failed:`, err?.message || err);
      if (attempt === MAX_RETRIES) throw err;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

async function main() {
  await waitForDb();
  const schemaSql = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  await conn.query(schemaSql);
  await conn.end();
  console.log('Database schema applied.');

  const { seed } = await import('./seed.js');
  await seed();
  console.log('Seed data loaded.');
}

main().catch((err) => {
  console.error('DB initialization failed:', err);
  process.exit(1);
});
