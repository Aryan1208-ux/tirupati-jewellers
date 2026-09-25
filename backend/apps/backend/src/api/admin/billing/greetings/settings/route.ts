import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../modules/billing"
import BillingModuleService from "../../../../../modules/billing/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    let settings = await billingModule.listBillingGreetingSettings()
    if (settings.length === 0) {
      settings = [await billingModule.createBillingGreetingSettings({})]
    }
    res.json({ settings: settings[0] })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch greeting settings." })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    let settingsList = await billingModule.listBillingGreetingSettings()
    let settings = settingsList[0]
    
    if (settings) {
      settings = await billingModule.updateBillingGreetingSettings({
        id: settings.id,
        ...req.body as any
      })
    } else {
      settings = await billingModule.createBillingGreetingSettings(req.body as any)
    }
    
    res.json({ settings })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to update greeting settings." })
  }
}
