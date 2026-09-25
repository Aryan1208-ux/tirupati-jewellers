const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const tables = [
      'payment_collection',
      'payment_session',
      'payment',
      'order_payment_collection',
      'order_transaction',
      'order_summary'
    ];
    for (let table of tables) {
      try {
        await pool.query(`UPDATE "${table}" SET currency_code = 'inr' WHERE currency_code = 'eur'`);
        console.log(`Updated ${table}`);
      } catch (e) {
        // ignore if column doesn't exist
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}
run();
