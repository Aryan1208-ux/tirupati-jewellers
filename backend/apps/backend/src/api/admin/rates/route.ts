import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { METAL_RATES_MODULE } from "../../../modules/metal-rates";
import { MetalRatesService } from "../../../modules/metal-rates/service";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const metalRatesService = req.scope.resolve<MetalRatesService>(METAL_RATES_MODULE);
  
  const { metal, purity_code, rate_per_gram, effective_from, notes, override_reason } = req.body as any;
  
  if (!metal || !purity_code || !rate_per_gram || !effective_from) {
    return res.status(400).json({ message: "metal, purity_code, rate_per_gram, and effective_from are required." });
  }

  const numericRate = Number(rate_per_gram);
  if (isNaN(numericRate) || numericRate <= 0) {
    return res.status(400).json({ message: "rate_per_gram must be a positive number." });
  }
  
  const effectiveDate = new Date(effective_from);
  if (isNaN(effectiveDate.getTime())) {
    return res.status(400).json({ message: "Invalid effective_from date." });
  }

  // Ensure purity is valid
  const purities = await metalRatesService.listMetalPurities({
    metal,
    purity_code,
    is_active: true
  });

  if (purities.length === 0) {
    return res.status(400).json({ message: `Invalid or inactive purity: ${purity_code} for metal ${metal}.` });
  }

  // Prevent overlapping or duplicate rates
  const existingExactRates = await metalRatesService.listMetalRates({
    metal,
    purity_code,
  });
  
  const exactMatch = existingExactRates.find(r => new Date(r.effective_from).getTime() === effectiveDate.getTime());
  if (exactMatch) {
    return res.status(400).json({ 
      message: "A rate already exists with this exact effective_from time." 
    });
  }

  // Create new rate — tagged as MANUAL_OVERRIDE
  const createdBy = (req as any).auth_context?.actor_id || "admin";

  const newRate = await metalRatesService.createMetalRates({
    metal,
    purity_code,
    rate_per_gram: numericRate,
    effective_from: effectiveDate,
    notes: notes || null,
    is_current: false,
    created_by: createdBy,
    source_type: "MANUAL_OVERRIDE",
    rate_derivation: "MANUAL",
    override_reason: override_reason || "Manual admin entry",
  } as any);

  res.status(201).json({ rate: newRate });
};
