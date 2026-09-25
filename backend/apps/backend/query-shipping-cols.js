const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    let res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'order_shipping_method'");
    console.log(res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
