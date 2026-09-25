import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../../modules/billing"
import BillingModuleService from "../../../../../../modules/billing/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const customer_id = req.params.id
    const histories = await billingModule.listBillingGreetingHistories({ customer_id }, {
      order: { created_at: "DESC" },
      relations: ["template"]
    })
    res.json({ histories })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch greeting history." })
  }
}
