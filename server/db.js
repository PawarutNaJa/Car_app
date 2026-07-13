// MySQL connection pool, shared across all route handlers.
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'car_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // return DATE/DATETIME/TIME as plain strings, not JS Date objects
});

export async function connectDb(retries = 8, delayMs = 2500) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      console.log('Connected to MySQL database.');
      return;
    } catch (err) {
      console.error(`MySQL connection attempt ${attempt} failed:`, err?.message || err);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
