const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    const res = await pool.query("SELECT id, amount, raw_amount FROM price");
    let count = 0;
    for (let row of res.rows) {
      if (row.amount) {
        const newAmount = Number(row.amount) * 8900;
        const newRawAmount = { ...row.raw_amount, value: newAmount.toString() };
        await pool.query(
          "UPDATE price SET amount = $1, raw_amount = $2 WHERE id = $3",
          [newAmount, newRawAmount, row.id]
        );
        count++;
      }
    }
    console.log(`Updated ${count} prices to realistic INR values.`);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
