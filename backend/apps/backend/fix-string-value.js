const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const jsonbCols = [
      { table: 'order_line_item', col: 'raw_unit_price' },
      { table: 'order_shipping_method', col: 'raw_amount' },
      { table: 'payment_collection', col: 'raw_amount' },
      { table: 'payment_session', col: 'raw_amount' },
      { table: 'payment', col: 'raw_amount' },
      { table: 'order_transaction', col: 'raw_amount' }
    ];

    for (let {table, col} of jsonbCols) {
       try {
         await pool.query(`
            UPDATE "${table}" 
            SET "${col}" = jsonb_set("${col}", '{value}', to_jsonb(("${col}"->>'value')::text))
            WHERE "${col}" IS NOT NULL
         `);
       } catch (e) {
         console.error(e.message);
       }
    }

    // Also fix order_summary
    const res = await pool.query('SELECT id, totals FROM order_summary');
    for (let row of res.rows) {
      if (row.totals) {
        let updatedTotals = { ...row.totals };
        for (let key in updatedTotals) {
           if (typeof updatedTotals[key] === 'object' && updatedTotals[key] !== null) {
              if (typeof updatedTotals[key].value === 'number') {
                 updatedTotals[key].value = String(updatedTotals[key].value);
              }
           }
        }
        await pool.query('UPDATE order_summary SET totals = $1 WHERE id = $2', [updatedTotals, row.id]);
      }
    }

    console.log("Fixed JSON values to be strings.");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
