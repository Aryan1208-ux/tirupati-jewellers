import Medusa from "@medusajs/js-sdk";
const medusa = new Medusa({ baseUrl: "http://localhost:9000", publishableKey: "test" });
async function run() {
  try {
    const res = await (medusa.admin as any).order.list({}, { headers: { Authorization: "Bearer test_dummy" } }); // wait, I don't have a valid admin token here. I'll just check the DB again.
  } catch (err) {}
}
