const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    // 1. Fix order_summary
    const res = await pool.query('SELECT id, totals FROM order_summary');
    for (let row of res.rows) {
      if (row.totals) {
        let updatedTotals = { ...row.totals };
        for (let key in updatedTotals) {
           if (typeof updatedTotals[key] === 'object' && updatedTotals[key] !== null) {
              if (updatedTotals[key].precision > 100) {
                 updatedTotals[key].precision = 20;
              }
           }
        }
        await pool.query('UPDATE order_summary SET totals = $1 WHERE id = $2', [updatedTotals, row.id]);
      }
    }
    
    // 2. Fix order_line_item
    await pool.query("UPDATE order_line_item SET raw_unit_price = jsonb_set(raw_unit_price, '{precision}', '20'::jsonb)");
    
    // 3. Fix order_shipping_method
    await pool.query("UPDATE order_shipping_method SET raw_amount = jsonb_set(raw_amount, '{precision}', '20'::jsonb)");
    
    // 4. Fix other tables
    const tables = ['payment_collection', 'payment_session', 'payment', 'order_transaction'];
    for (let t of tables) {
      try {
        await pool.query(`UPDATE "${t}" SET raw_amount = jsonb_set(raw_amount, '{precision}', '20'::jsonb)`);
      } catch (e) {}
    }

    console.log("Fixed precision back to 20 everywhere!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
