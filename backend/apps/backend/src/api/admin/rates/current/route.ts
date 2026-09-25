import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { METAL_RATES_MODULE } from "../../../../modules/metal-rates";
import { MetalRatesService } from "../../../../modules/metal-rates/service";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const metalRatesService = req.scope.resolve<MetalRatesService>(METAL_RATES_MODULE);
  
  // To correctly resolve the *active* rate for each configured metal+purity,
  // we cannot rely solely on the `is_current` boolean if there are future-dated rates.
  // The authoritative selection is based on: effective_from <= NOW.
  
  const now = new Date();
  const activeRates: any[] = [];

  // First, identify the purities we care about
  const puritiesQuery: any = { is_active: true };
  if (req.query.metal) puritiesQuery.metal = req.query.metal;
  if (req.query.purity_code) puritiesQuery.purity_code = req.query.purity_code;

  const purities = await metalRatesService.listMetalPurities(puritiesQuery);

  for (const purity of purities) {
    // Fetch the recent rates for this specific metal+purity combination
    // We order by effective_from DESC so the most recent rate comes first.
    const [rates] = await metalRatesService.listAndCountMetalRates({
      metal: purity.metal,
      purity_code: purity.purity_code,
    }, {
      order: { effective_from: "DESC" },
      take: 20 // Look at the last 20 rates to find the active one
    });

    // The active rate is the first one where effective_from <= now
    const activeRate = rates.find(r => new Date(r.effective_from) <= now);
    
    if (activeRate) {
      activeRates.push(activeRate);
    }
  }

  res.json({ rates: activeRates });
};
