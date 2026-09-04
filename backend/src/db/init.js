import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDB() {
  try {
    console.log("Connecting to Supabase database...");
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log("Creating tables from schema.sql...");
    await pool.query(schemaSql);
    console.log("✅ Tables created successfully!");
    
    pool.end();
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    pool.end();
    process.exit(1);
  }
}

initDB();
