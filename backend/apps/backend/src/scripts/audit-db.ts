import { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function auditData({ container }: { container: MedusaContainer }) {
  const regionService = container.resolve(Modules.REGION);
  const regions = await regionService.listRegions();
  console.log("REGIONS:", JSON.stringify(regions, null, 2));
  
  const taxRegionService = container.resolve(Modules.TAX);
  const taxRegions = await taxRegionService.listTaxRegions();
  console.log("TAX REGIONS:", JSON.stringify(taxRegions, null, 2));
  
  const taxRates = await taxRegionService.listTaxRates();
  console.log("TAX RATES:", JSON.stringify(taxRates, null, 2));
  
  const productModule = container.resolve(Modules.PRODUCT);
  const products = await productModule.listProducts({}, { relations: ["variants"], take: 1 });
  console.log("PRODUCTS:", JSON.stringify(products, null, 2));

  const pricingModule = container.resolve(Modules.PRICING);
  const priceSets = await pricingModule.listPriceSets({}, { relations: ["prices"], take: 1 });
  console.log("PRICE SETS:", JSON.stringify(priceSets, null, 2));
}
