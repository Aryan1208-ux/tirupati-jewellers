import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../modules/billing"
import BillingModuleService from "../../../../../modules/billing/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const [settings] = await billingModule.listBillingSettings()
    
    // We only expose non-secret info to the admin UI
    res.json({
      configured: !!settings?.gstin,
      environment: process.env.EINVOICE_ENVIRONMENT || "SANDBOX",
      provider: "MockEInvoiceProvider", // This would be dynamic in production
      seller_gstin: settings?.gstin || null,
      status: "ACTIVE"
    })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch e-invoice status." })
  }
}
