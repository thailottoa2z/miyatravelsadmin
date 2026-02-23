import { pool } from "./db";

async function addMissingColumn() {
  try {
    console.log("Checking if enquired_service_type column exists...");
    
    // Check if column exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='service_calls' AND column_name='enquired_service_type'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log("Column already exists!");
      return;
    }
    
    console.log("Column not found. Creating...");
    
    // Create the enum type
    try {
      await pool.query(`
        CREATE TYPE "enquired_service_type" AS ENUM(
          'Flight Ticket',
          'Cab',
          'Passport / Visa',
          'Medical'
        )
      `);
      console.log("Enum type created");
    } catch (enumError) {
      console.log("Enum type already exists, continuing...");
    }
    
    // Add the column
    await pool.query(`
      ALTER TABLE "service_calls"
      ADD COLUMN "enquired_service_type" "enquired_service_type"
    `);
    
    console.log("Column added successfully!");
    
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

addMissingColumn();
