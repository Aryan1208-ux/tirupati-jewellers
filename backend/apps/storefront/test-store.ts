import Medusa from "@medusajs/js-sdk";
const medusa = new Medusa({ baseUrl: "http://localhost:9000", publishableKey: "test" });
console.log(Object.keys(medusa.store));
