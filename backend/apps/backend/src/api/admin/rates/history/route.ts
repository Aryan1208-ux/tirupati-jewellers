import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { METAL_RATES_MODULE } from "../../../../modules/metal-rates";
import { MetalRatesService } from "../../../../modules/metal-rates/service";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const metalRatesService = req.scope.resolve<MetalRatesService>(METAL_RATES_MODULE);
  
  const query: any = {};
  
  if (req.query.metal) {
    query.metal = req.query.metal;
  }
  
  if (req.query.purity_code) {
    query.purity_code = req.query.purity_code;
  }
  
  // Basic pagination
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  
  const [rates, count] = await metalRatesService.listAndCountMetalRates(query, {
    skip: offset,
    take: limit,
    order: {
      effective_from: "DESC"
    }
  });

  res.json({ rates, count, limit, offset });
};
