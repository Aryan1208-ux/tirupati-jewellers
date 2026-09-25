const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    // Check current region
    let res = await pool.query("SELECT id, currency_code FROM region");
    console.log("Before:", res.rows);
    
    // Update to INR
    await pool.query("UPDATE region SET currency_code = 'inr'");
    
    // Check after update
    res = await pool.query("SELECT id, currency_code FROM region");
    console.log("After:", res.rows);

    // Also update any stores to ensure default_currency_code is inr
    let storeRes = await pool.query("SELECT id, default_currency_code FROM store");
    console.log("Store before:", storeRes.rows);
    await pool.query("UPDATE store SET default_currency_code = 'inr'");
    
    console.log("Successfully updated currency to INR in DB.");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
