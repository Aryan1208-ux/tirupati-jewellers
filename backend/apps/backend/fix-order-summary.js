const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const res = await pool.query('SELECT id, totals FROM order_summary');
    for (let row of res.rows) {
      if (row.totals) {
        let updatedTotals = { ...row.totals };
        for (let key in updatedTotals) {
           if (typeof updatedTotals[key] === 'number' && updatedTotals[key] < 50000) {
              updatedTotals[key] = updatedTotals[key] * 8900;
           } else if (typeof updatedTotals[key] === 'object' && updatedTotals[key] !== null) {
              // it's a raw object maybe
              for (let innerKey in updatedTotals[key]) {
                  if (typeof updatedTotals[key][innerKey] === 'string' && Number(updatedTotals[key][innerKey]) < 50000) {
                      updatedTotals[key][innerKey] = (Number(updatedTotals[key][innerKey]) * 8900).toString();
                  } else if (typeof updatedTotals[key][innerKey] === 'number' && updatedTotals[key][innerKey] < 50000) {
                      updatedTotals[key][innerKey] = updatedTotals[key][innerKey] * 8900;
                  }
              }
           }
        }
        await pool.query('UPDATE order_summary SET totals = $1 WHERE id = $2', [updatedTotals, row.id]);
      }
    }
    console.log("Updated order_summary JSON totals!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
