import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../modules/billing"
import BillingModuleService from "../../../../modules/billing/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  
  let [settings] = await billingModule.listBillingSettings()
  
  // Create default if none exists
  if (!settings) {
    settings = await billingModule.createBillingSettings({
      business_name: "Tirupati Jewellers",
      legal_name: "Tirupati Jewellers",
      invoice_prefix: "TJ/",
      financial_year: "2026-27",
      state_code: "07",
    })
  }
  
  res.json({ settings })
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  
  try {
    let [settings] = await billingModule.listBillingSettings()
    
    if (settings) {
      settings = await billingModule.updateBillingSettings({
        id: settings.id,
        ...req.body as any
      })
    } else {
      settings = await billingModule.createBillingSettings(req.body as any)
    }
    
    res.json({ settings })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export const AUTHENTICATE = false;
