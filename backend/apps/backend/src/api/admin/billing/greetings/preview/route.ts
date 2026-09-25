import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../modules/billing"
import BillingModuleService from "../../../../../modules/billing/service"
import { renderGreetingTemplate } from "../../../../../modules/billing/utils/greetings"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const { template_id, customer_id, occasion_name } = req.body as any
    const template = await billingModule.retrieveBillingGreetingTemplate(template_id)
    let customer
    if (customer_id) {
      customer = await billingModule.retrieveBillingCustomer(customer_id)
    }

    const context = {
      customer_name: customer?.name || "Valued Customer",
      occasion_name: occasion_name || template.occasion_type,
    }

    const rendered = renderGreetingTemplate(template.message, context)
    const rendered_subject = template.subject ? renderGreetingTemplate(template.subject, context) : null

    res.json({ rendered, rendered_subject })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to preview template." })
  }
}
