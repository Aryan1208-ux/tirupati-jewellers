const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const res = await pool.query("SELECT id, totals FROM order_summary WHERE order_id = 'order_01M2KD0DTNGPPQ3PBZVA84Y7ZT'");
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
