import { MedusaContainer } from "@medusajs/framework/types";
import { METAL_RATES_MODULE } from "../modules/metal-rates";
import { MetalRatesService } from "../modules/metal-rates/service";

export default async function seedPurities({
  container,
}: {
  container: MedusaContainer;
}) {
  const metalRatesService = container.resolve<MetalRatesService>(METAL_RATES_MODULE);
  
  const puritiesToSeed = [
    { metal: "GOLD", purity_code: "24K", display_name: "24K Gold", factor: 1.0 },
    { metal: "GOLD", purity_code: "22K", display_name: "22K Gold", factor: 0.9167 },
    { metal: "GOLD", purity_code: "18K", display_name: "18K Gold", factor: 0.75 },
    { metal: "GOLD", purity_code: "14K", display_name: "14K Gold", factor: 0.5833 },
    { metal: "SILVER", purity_code: "999", display_name: "999 Silver", factor: 0.999 },
    { metal: "SILVER", purity_code: "925", display_name: "925 Silver", factor: 0.925 },
  ];

  let count = 0;
  for (const purity of puritiesToSeed) {
    const existing = await metalRatesService.listMetalPurities({
      metal: purity.metal as any,
      purity_code: purity.purity_code,
    });
    
    if (existing.length === 0) {
      await metalRatesService.createMetalPurities(purity as any);
      console.log(`Seeded purity: ${purity.display_name}`);
      count++;
    }
  }

  console.log(`Purity seeding complete. Seeded ${count} new purities.`);
}
