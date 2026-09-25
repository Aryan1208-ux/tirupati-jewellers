const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const order = await pool.query("SELECT * FROM \"order\" WHERE id = 'order_01M2KD0DTNGPPQ3PBZVA84Y7ZT'");
    console.log("Order:", order.rows[0]);

    const items = await pool.query("SELECT * FROM order_item WHERE order_id = 'order_01M2KD0DTNGPPQ3PBZVA84Y7ZT'");
    console.log("Items:", items.rows.map(i => ({ id: i.id, unit_price: i.unit_price, raw: i.raw_unit_price })));

    const summary = await pool.query("SELECT * FROM order_summary WHERE order_id = 'order_01M2KD0DTNGPPQ3PBZVA84Y7ZT'");
    console.log("Summary:", summary.rows[0].totals);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
