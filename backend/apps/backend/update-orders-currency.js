const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    console.log("Updating order currency...");
    await pool.query("UPDATE \"order\" SET currency_code = 'inr' WHERE currency_code = 'eur'");
    
    console.log("Updating cart currency...");
    await pool.query("UPDATE cart SET currency_code = 'inr' WHERE currency_code = 'eur'");
    
    console.log("Updating line item currency...");
    // Check if line_item exists or if there's a currency column
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'order_item'");
    console.log("Order item columns:", res.rows.map(r => r.column_name));
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}
run();
