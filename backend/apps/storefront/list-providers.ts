import Medusa from "@medusajs/js-sdk";
require('dotenv').config({ path: '.env.local' });
const medusa = new Medusa({ baseUrl: "http://localhost:9000", publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY });

async function run() {
  try {
    const res = await (medusa.store.payment as any).listPaymentProviders();
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}
run();
