import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 60000,
  max: 10
});

pool.on('error', (err) => {
  console.error('DB Error:', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;