const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    let curr = await pool.query("SELECT * FROM store_currency");
    console.log("Before store_currency:", curr.rows);
    await pool.query("UPDATE store_currency SET currency_code = 'inr', is_default = true WHERE currency_code = 'eur'");
    curr = await pool.query("SELECT * FROM store_currency");
    console.log("After store_currency:", curr.rows);

    let priceLists = await pool.query("SELECT * FROM price");
    console.log("Before price:", priceLists.rows.length, "rows");
    await pool.query("UPDATE price SET currency_code = 'inr' WHERE currency_code = 'eur'");
    console.log("Successfully updated currency in store_currency and price tables.");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
