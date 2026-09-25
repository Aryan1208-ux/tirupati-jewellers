import Medusa from "@medusajs/js-sdk";
require('dotenv').config({ path: '.env.local' });
const medusa = new Medusa({ baseUrl: "http://localhost:9000", publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY });

async function run() {
  try {
    const { regions } = await (medusa.store.region as any).list();
    const region = regions[0];

    const { cart } = await (medusa.store.cart as any).create({ region_id: region.id, email: "test2@example.com", currency_code: "inr" });
    console.log("Cart created:", cart.id);

    // 4. Initiate payment
    console.log("Initiating payment session...");
    const res = await (medusa.store.payment as any).initiatePaymentSession(cart.id, { provider_id: "cod" });
    console.log("Payment initiated!");

    // 5. Complete cart
    const complete = await (medusa.store.cart as any).complete(cart.id);
    console.log("Cart completed!", complete.type);
  } catch (err) {
    console.error(err);
  }
}
run();
