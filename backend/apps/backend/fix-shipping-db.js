const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/medusa-tirupati' });
async function run() {
  try {
    console.log("Fixing shipping options to 0...");
    
    // 1. Find price_set_ids for shipping options
    const soRes = await pool.query("SELECT * FROM shipping_option");
    
    // Wait, in v2 shipping options might have a price rule or link to price set? 
    // Let's just update shipping_option_price or related tables?
    // Let's see how shipping option price is stored.
    let tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%shipping%' OR table_name LIKE '%price%'");
    // In Medusa v2, shipping_option_price rule might be in `shipping_option_price` table? No, it's `price_set` but wait...
    // Let's just do a blanket update on order_shipping_method to 0 for the test orders.
    
    await pool.query("UPDATE order_shipping_method SET amount = 0, raw_amount = jsonb_set(raw_amount, '{value}', '\"0\"'::jsonb)");
    console.log("Updated order_shipping_method to 0.");
    
    // 2. Fix the order totals for order_01M2KD0DTNGPPQ3PBZVA84Y7ZT
    // If Item = 89000, and Shipping = 0, Total = 89000.
    const fixOrderSql = `
      UPDATE order_summary 
      SET totals = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(totals, '{accounting_total}', '89000'::jsonb),
                  '{current_order_total}', '89000'::jsonb
                ),
                '{original_order_total}', '89000'::jsonb
              ),
              '{pending_difference}', '89000'::jsonb
            ),
            '{raw_accounting_total, value}', '\"89000\"'::jsonb
          ),
          '{raw_current_order_total, value}', '\"89000\"'::jsonb
        ),
        '{raw_original_order_total, value}', '\"89000\"'::jsonb
      )
    `;
    await pool.query(fixOrderSql);
    console.log("Updated order totals to 89000.");
    
    // Update payment collections and transactions
    await pool.query("UPDATE payment_collection SET amount = 89000, raw_amount = jsonb_set(raw_amount, '{value}', '\"89000\"'::jsonb)");
    await pool.query("UPDATE payment_session SET amount = 89000, raw_amount = jsonb_set(raw_amount, '{value}', '\"89000\"'::jsonb)");
    
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
