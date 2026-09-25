import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../modules/billing"
import BillingModuleService from "../../../../../modules/billing/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const occasions = await billingModule.listBillingGreetingOccasions({}, {
      order: { start_date: "ASC" }
    })
    res.json({ occasions })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch occasions." })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const { name, start_date, end_date, is_active, greeting_text, bill_greeting_text, enable_on_bill } = req.body as any
    const occasion = await billingModule.createBillingGreetingOccasions({
      name,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      is_active: is_active ?? true,
      greeting_text: greeting_text || null,
      bill_greeting_text: bill_greeting_text || null,
      enable_on_bill: enable_on_bill ?? false,
    })
    res.json({ occasion })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to create occasion." })
  }
}
