const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const res = await pool.query('SELECT * FROM order_line_item LIMIT 2');
    console.log("Before line item:", res.rows[0]);
    
    await pool.query("UPDATE order_line_item SET unit_price = unit_price * 8900 WHERE unit_price > 0 AND unit_price < 50000");
    await pool.query("UPDATE order_line_item SET raw_unit_price = jsonb_set(raw_unit_price, '{value}', to_jsonb((raw_unit_price->>'value')::numeric * 8900)::text::jsonb) WHERE (raw_unit_price->>'value')::numeric < 50000");

    await pool.query("UPDATE order_shipping_method SET amount = amount * 8900 WHERE amount > 0 AND amount < 50000");
    await pool.query("UPDATE order_shipping_method SET raw_amount = jsonb_set(raw_amount, '{value}', to_jsonb((raw_amount->>'value')::numeric * 8900)::text::jsonb) WHERE (raw_amount->>'value')::numeric < 50000");

    const afterRes = await pool.query('SELECT * FROM order_line_item LIMIT 2');
    console.log("After line item:", afterRes.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
