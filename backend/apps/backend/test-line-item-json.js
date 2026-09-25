const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const res = await pool.query("SELECT raw_unit_price FROM order_line_item");
    console.log(JSON.stringify(res.rows[0], null, 2));
    
    const res2 = await pool.query("SELECT raw_amount FROM order_shipping_method");
    console.log(JSON.stringify(res2.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
