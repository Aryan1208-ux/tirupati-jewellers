const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    let res = await pool.query("SELECT * FROM price LIMIT 5");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
