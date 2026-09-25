const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const methods = await pool.query("SELECT * FROM order_shipping_method WHERE order_id = 'order_01M2KD0DTNGPPQ3PBZVA84Y7ZT'");
    console.log("Order Shipping Methods:", methods.rows.map(m => ({ id: m.id, amount: m.amount, raw_amount: m.raw_amount })));

    const options = await pool.query("SELECT * FROM shipping_option");
    console.log("Shipping Options:", options.rows.map(o => ({ id: o.id, name: o.name, amount: o.amount })));
    
    // Also check the shipping option price in price table? Wait, v2 shipping options might use different pricing.
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
