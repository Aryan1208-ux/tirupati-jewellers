import { Module } from "@medusajs/framework/utils";
import { MetalRatesService } from "./service";

export const METAL_RATES_MODULE = "metal_rates";

export default Module(METAL_RATES_MODULE, {
  service: MetalRatesService,
});
