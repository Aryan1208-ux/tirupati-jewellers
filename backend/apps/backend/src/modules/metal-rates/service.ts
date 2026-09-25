import { MedusaService } from "@medusajs/framework/utils";
import { MetalPurity } from "./models/purity";
import { MetalRate } from "./models/rate";

export class MetalRatesService extends MedusaService({
  MetalPurity,
  MetalRate,
}) {
  
}
