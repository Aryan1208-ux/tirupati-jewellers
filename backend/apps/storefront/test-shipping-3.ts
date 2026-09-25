import Medusa from "@medusajs/js-sdk";
require('dotenv').config({ path: '.env.local' });
const medusa = new Medusa({ baseUrl: "http://localhost:9000", publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY });

async function run() {
  try {
    const { regions } = await (medusa.store.region as any).list();
    const region = regions[0];

    const { cart } = await (medusa.store.cart as any).create({ region_id: region.id, email: "test3@example.com", currency_code: "inr" });
    console.log("Cart created:", cart.id);

    // 3. Add shipping method
    const { shipping_options } = await (medusa.store.fulfillment as any).listCartOptions({ cart_id: cart.id });
    if (shipping_options && shipping_options.length > 0) {
      console.log("Adding shipping option:", shipping_options[0].id);
      await (medusa.store.cart as any).addShippingMethod(cart.id, { option_id: shipping_options[0].id });
    }

    // 4. Initiate payment
    console.log("Initiating payment session...");
    const res = await (medusa.store.payment as any).initiatePaymentSession(cart, { provider_id: "pp_system_default" });
    console.log("Payment initiated!");

    // 5. Complete cart
    const complete = await (medusa.store.cart as any).complete(cart.id);
    console.log("Cart completed!", complete.type, complete.order?.id);
  } catch (err) {
    console.error(err);
  }
}
run();
