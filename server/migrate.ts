import "dotenv/config";
import { pool } from "./db";

async function migrate() {
  try {
    console.log("Running migration...");

    // Create service_calls table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_calls (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        call_date TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ service_calls table created");

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_service_calls_status ON service_calls(status);
      CREATE INDEX IF NOT EXISTS idx_service_calls_call_date ON service_calls(call_date);
      CREATE INDEX IF NOT EXISTS idx_service_calls_phone ON service_calls(phone_number);
    `);

    console.log("✓ Indexes created");
    console.log("✓ Migration completed successfully");

    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
