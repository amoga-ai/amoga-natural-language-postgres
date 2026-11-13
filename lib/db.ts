import { Pool } from "pg";

// One shared connection pool. Coolify uses a self-signed certificate, so certificate checks are off for this test database.
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: false,
  max: 5,
});

// Runs one query on the database and returns its rows.
export async function runQuery<T = any>(text: string): Promise<T[]> {
  const result = await pool.query(text);
  return result.rows as T[];
}