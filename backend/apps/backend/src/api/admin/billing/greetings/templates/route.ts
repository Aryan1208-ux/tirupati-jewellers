import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../modules/billing"
import BillingModuleService from "../../../../../modules/billing/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const templates = await billingModule.listBillingGreetingTemplates()
    res.json({ templates })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch templates." })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const { name, occasion_type, channel, language, subject, message, is_active } = req.body as any
    const template = await billingModule.createBillingGreetingTemplates({
      name,
      occasion_type,
      channel,
      language,
      subject,
      message,
      is_active: is_active ?? true,
    })
    res.json({ template })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to create template." })
  }
}
