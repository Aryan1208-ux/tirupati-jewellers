import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../modules/billing"
import BillingModuleService from "../../../../../modules/billing/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const history = await billingModule.listBillingGreetingHistories({}, {
      order: { created_at: "DESC" },
      relations: ["customer"]
    })
    res.json({ history })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch greeting history." })
  }
}
