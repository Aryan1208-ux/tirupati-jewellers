const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const res = await pool.query("SELECT id, display_id FROM \"order\" ORDER BY created_at DESC LIMIT 5;");
    console.log("Orders found:");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
