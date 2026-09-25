import Medusa from "@medusajs/js-sdk";
const medusa = new Medusa({ baseUrl: "http://localhost:9000", publishableKey: "test" });

async function run() {
  try {
    // 1. Get first region
    const { regions } = await (medusa.store.region as any).list();
    const region = regions[0];

    // 2. Create cart
    const { cart } = await (medusa.store.cart as any).create({ region_id: region.id, email: "test@example.com", currency_code: "inr" });
    console.log("Cart created:", cart.id);

    // 3. Add shipping method
    const { shipping_options } = await (medusa.store.fulfillment as any).listCartOptions({ cart_id: cart.id });
    if (shipping_options && shipping_options.length > 0) {
      console.log("Adding shipping option:", shipping_options[0].id);
      await (medusa.store.cart as any).addShippingMethod(cart.id, { option_id: shipping_options[0].id });
    } else {
      console.log("No shipping options available!");
    }

    // 4. Initiate payment
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
