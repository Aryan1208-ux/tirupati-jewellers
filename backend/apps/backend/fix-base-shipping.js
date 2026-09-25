const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    console.log("Checking price_set for shipping...");
    const res = await pool.query("SELECT * FROM shipping_option_price_set");
    console.log(res.rows);
    
    // For every shipping option price_set, set its price to 0
    for (let row of res.rows) {
      await pool.query("UPDATE price SET amount = 0, raw_amount = jsonb_set(raw_amount, '{value}', '\"0\"'::jsonb) WHERE price_set_id = $1", [row.price_set_id]);
    }
    console.log("Base shipping options updated to 0");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
