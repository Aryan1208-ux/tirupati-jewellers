import Medusa from "@medusajs/js-sdk";
const medusa = new Medusa({ baseUrl: "http://localhost:9000", publishableKey: "test" });

async function run() {
  try {
    const { regions } = await (medusa.store.region as any).list();
    const region = regions[0];

    const { cart } = await (medusa.store.cart as any).create({ region_id: region.id });
    console.log("Cart created:", cart.id);

    // Get shipping options
    // Then add shipping method
    // Then initiate payment session
  } catch (err) {
    console.error(err);
  }
}
run();
