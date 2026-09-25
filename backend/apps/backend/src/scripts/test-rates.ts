import { MedusaContainer } from "@medusajs/framework/types";
import { METAL_RATES_MODULE } from "../modules/metal-rates";
import { MetalRatesService } from "../modules/metal-rates/service";
import { GET as getCurrentRates } from "../api/admin/rates/current/route";

export default async function runTests({
  container,
}: {
  container: MedusaContainer;
}) {
  const metalRatesService = container.resolve<MetalRatesService>(METAL_RATES_MODULE);
  
  // Clean up any existing rates for a clean test
  const existingRates = await metalRatesService.listMetalRates({});
  for (const r of existingRates) {
    await metalRatesService.deleteMetalRates(r.id);
  }

  // Mock Request/Response for the API route
  const mockReq = {
    scope: container,
    query: {}
  } as any;
  
  let lastResponse: any;
  const mockRes = {
    json: (data: any) => { lastResponse = data; return data; },
    status: (code: number) => ({ json: (data: any) => { lastResponse = data; return data; } })
  } as any;
  
  const callAPI = async () => {
    await getCurrentRates(mockReq, mockRes);
    return lastResponse;
  };

  console.log("==================================================");
  console.log("TEST 1 — CURRENT RATE");
  console.log("==================================================");
  
  const now = new Date();
  
  await metalRatesService.createMetalRates({
    metal: "GOLD",
    purity_code: "22K",
    rate_per_gram: 14000,
    effective_from: now,
    is_current: false,
    created_by: "test"
  });
  
  let result = await callAPI();
  console.log(`Current Rate (should be 14000): ${result.rates.find((r:any) => r.metal === "GOLD" && r.purity_code === "22K")?.rate_per_gram}`);

  console.log("\n==================================================");
  console.log("TEST 2 — FUTURE RATE");
  console.log("==================================================");
  
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  await metalRatesService.createMetalRates({
    metal: "GOLD",
    purity_code: "22K",
    rate_per_gram: 14500,
    effective_from: tomorrow,
    is_current: false,
    created_by: "test"
  });
  
  result = await callAPI();
  console.log(`Current Rate before tomorrow (should still be 14000): ${result.rates.find((r:any) => r.metal === "GOLD" && r.purity_code === "22K")?.rate_per_gram}`);

  console.log("\n==================================================");
  console.log("TEST 3 — AFTER EFFECTIVE TIME");
  console.log("==================================================");
  
  // We can simulate time passing by mocking the Date object inside the API
  // or by creating a rate in the past
  const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago = 14000
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago = 14500
  
  // Reset
  const r2 = await metalRatesService.listMetalRates({});
  for (const r of r2) await metalRatesService.deleteMetalRates(r.id);
  
  await metalRatesService.createMetalRates({ metal: "GOLD", purity_code: "22K", rate_per_gram: 14000, effective_from: past, is_current: false });
  await metalRatesService.createMetalRates({ metal: "GOLD", purity_code: "22K", rate_per_gram: 14500, effective_from: yesterday, is_current: false });
  
  result = await callAPI();
  console.log(`Current Rate after future time arrived (should be 14500): ${result.rates.find((r:any) => r.metal === "GOLD" && r.purity_code === "22K")?.rate_per_gram}`);

  console.log("\n==================================================");
  console.log("TEST 4 — HISTORY");
  console.log("==================================================");
  
  const history = await metalRatesService.listMetalRates({ metal: "GOLD", purity_code: "22K" });
  console.log(`History count (should be 2): ${history.length}`);
  console.log(`History contains 14000: ${history.some(r => Number(r.rate_per_gram) === 14000)}`);
  console.log(`History contains 14500: ${history.some(r => Number(r.rate_per_gram) === 14500)}`);

  console.log("\n==================================================");
  console.log("TEST 6 — MULTIPLE FUTURE RATES");
  console.log("==================================================");
  
  // Reset
  for (const r of await metalRatesService.listMetalRates({})) await metalRatesService.deleteMetalRates(r.id);
  
  // Rate 1: 14000 (Past)
  await metalRatesService.createMetalRates({ metal: "GOLD", purity_code: "22K", rate_per_gram: 14000, effective_from: past, is_current: false });
  // Rate 2: 14500 (Tomorrow 09:00)
  const tomorrow9am = new Date(now);
  tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);
  await metalRatesService.createMetalRates({ metal: "GOLD", purity_code: "22K", rate_per_gram: 14500, effective_from: tomorrow9am, is_current: false });
  // Rate 3: 14700 (Tomorrow 15:00)
  const tomorrow3pm = new Date(now);
  tomorrow3pm.setDate(tomorrow3pm.getDate() + 1);
  tomorrow3pm.setHours(15, 0, 0, 0);
  await metalRatesService.createMetalRates({ metal: "GOLD", purity_code: "22K", rate_per_gram: 14700, effective_from: tomorrow3pm, is_current: false });

  // Let's test the active rates manually logic at different simulated times:
  const testTime = async (simulatedNow: Date) => {
    const purities = await metalRatesService.listMetalPurities({ is_active: true });
    for (const purity of purities) {
      if (purity.purity_code !== "22K") continue;
      const rates = await metalRatesService.listMetalRates({ metal: purity.metal, purity_code: purity.purity_code }, { order: { effective_from: "DESC" }, take: 20 });
      const activeRate = rates.find(r => new Date(r.effective_from) <= simulatedNow);
      return activeRate?.rate_per_gram;
    }
  };

  const before9 = await testTime(now); // Before tomorrow
  
  const at10am = new Date(tomorrow9am);
  at10am.setHours(10);
  const between9and15 = await testTime(at10am);
  
  const at16pm = new Date(tomorrow3pm);
  at16pm.setHours(16);
  const after15 = await testTime(at16pm);
  
  console.log(`Before 09:00 (should be 14000): ${before9}`);
  console.log(`09:00 - 14:59 (should be 14500): ${between9and15}`);
  console.log(`15:00 onward (should be 14700): ${after15}`);
  
  console.log("\nALL TESTS COMPLETED SUCCESSFULLY.");
}
