/**
 * Public Store Rates API
 * 
 * Returns current metal rates for the storefront ticker.
 * Does NOT expose provider credentials, API keys, or internal config.
 * Returns only: metal, purity_code, rate_per_gram, effective_from, source_type, updated_at
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { METAL_RATES_MODULE } from "../../../modules/metal-rates";
import { MetalRatesService } from "../../../modules/metal-rates/service";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const metalRatesService = req.scope.resolve<MetalRatesService>(METAL_RATES_MODULE);
  
  const now = new Date();
  const activeRates: any[] = [];

  const purities = await metalRatesService.listMetalPurities({ is_active: true });

  for (const purity of purities) {
    const [rates] = await metalRatesService.listAndCountMetalRates({
      metal: purity.metal,
      purity_code: purity.purity_code,
    }, {
      order: { effective_from: "DESC" },
      take: 20,
    });

    const activeRate = rates.find(r => new Date(r.effective_from) <= now);
    
    if (activeRate) {
      // Only expose safe public fields — no provider keys, no internal IDs
      activeRates.push({
        metal: activeRate.metal,
        purity_code: activeRate.purity_code,
        rate_per_gram: activeRate.rate_per_gram,
        effective_from: activeRate.effective_from,
        source_type: (activeRate as any).source_type || "MANUAL",
        updated_at: activeRate.updated_at || activeRate.effective_from,
      });
    }
  }

  // Calculate staleness
  const maxStalenessMinutes = parseInt(process.env.METAL_RATE_MAX_STALENESS_MINUTES || "60", 10);
  const latestUpdate = activeRates.reduce((latest, r) => {
    const d = new Date(r.effective_from);
    return d > latest ? d : latest;
  }, new Date(0));
  
  const minutesSinceUpdate = (now.getTime() - latestUpdate.getTime()) / (1000 * 60);
  const isStale = minutesSinceUpdate > maxStalenessMinutes;

  res.json({
    rates: activeRates,
    status: activeRates.length === 0 ? "NO_DATA" : isStale ? "STALE" : "LIVE",
    last_updated: latestUpdate.toISOString(),
    staleness_minutes: Math.round(minutesSinceUpdate),
  });
};
