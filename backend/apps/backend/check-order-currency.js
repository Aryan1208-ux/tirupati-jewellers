const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    let res = await pool.query("SELECT id, currency_code FROM \"order\"");
    console.log("Orders:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
