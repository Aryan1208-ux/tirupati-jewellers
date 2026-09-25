import Medusa from "@medusajs/js-sdk";
require('dotenv').config({ path: '.env.local' });
const medusa = new Medusa({ baseUrl: "http://localhost:9000", publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY });

async function run() {
  try {
    const { regions } = await (medusa.store.region as any).list();
    console.log("Current regions:", regions.map((r: any) => ({ id: r.id, currency: r.currency_code })));
  } catch (err) {
    console.error(err);
  }
}
run();
