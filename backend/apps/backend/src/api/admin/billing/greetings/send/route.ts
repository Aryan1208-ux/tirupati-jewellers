import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../modules/billing"
import BillingModuleService from "../../../../../modules/billing/service"
import { renderGreetingTemplate } from "../../../../../modules/billing/utils/greetings"
import { sendMessage } from "../../../../../lib/messaging"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const { template_id, customer_id, occasion_name, manual_message } = req.body as any
    const customer = await billingModule.retrieveBillingCustomer(customer_id)
    
    let rendered = manual_message
    let channel: "whatsapp" | "sms" | "email" = "whatsapp"
    let template: any = null

    if (template_id) {
      template = await billingModule.retrieveBillingGreetingTemplate(template_id)
      channel = template.channel as any
      const context = {
        customer_name: customer.name || "Valued Customer",
        occasion_name: occasion_name || template.occasion_type,
      }
      rendered = renderGreetingTemplate(template.message, context)
    }

    if (!rendered) {
      return res.status(400).json({ error: "Message content is missing." })
    }

    if (!customer.mobile && channel !== "email") {
      return res.status(400).json({ error: "Customer has no mobile number for " + channel })
    }

    // Call messaging provider (simulated)
    const result = await sendMessage({
      to: channel === "email" ? (customer.email || "") : (customer.mobile || ""),
      channel,
      content: rendered,
      isSimulated: true // Test mode / Simulation
    })

    // Log the history
    const history = await billingModule.createBillingGreetingHistories({
      occasion_name: occasion_name || (template ? template.occasion_type : "Manual Greeting"),
      channel,
      rendered_message: rendered,
      status: result.success ? "SENT" : "FAILED",
      error_message: result.error || null,
      sent_at: result.success ? new Date() : undefined,
      customer_id: customer.id,
      template_id: template?.id,
    })

    res.json({ history, success: result.success })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to send greeting." })
  }
}
