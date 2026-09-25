const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const updateQuery = (table, col) => `UPDATE "${table}" SET "${col}" = "${col}" * 8900 WHERE "${col}" > 0 AND "${col}" < 50000;`;
    
    await pool.query(updateQuery('order_item', 'unit_price'));
    await pool.query(`UPDATE order_item SET raw_unit_price = jsonb_set(raw_unit_price, '{value}', to_jsonb((raw_unit_price->>'value')::numeric * 8900)::text::jsonb) WHERE (raw_unit_price->>'value')::numeric < 50000`);
    
    const tablesWithAmount = ['payment_collection', 'payment_session', 'payment', 'order_transaction'];
    for (let t of tablesWithAmount) {
      await pool.query(updateQuery(t, 'amount'));
      try {
         await pool.query(`UPDATE "${t}" SET raw_amount = jsonb_set(raw_amount, '{value}', to_jsonb((raw_amount->>'value')::numeric * 8900)::text::jsonb) WHERE (raw_amount->>'value')::numeric < 50000`);
      } catch (e) {}
    }

    console.log("Updated order amounts.");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
