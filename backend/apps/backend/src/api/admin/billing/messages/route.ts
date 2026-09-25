import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../modules/billing"
import BillingModuleService from "../../../../modules/billing/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const {
      customer_id,
      invoice_id,
      channel,
      message_type,
      message_content,
      sent_by,
      delivery_status,
      provider_message_id,
    } = req.body as any

    if (!customer_id || !message_content) {
      return res.status(400).json({ error: "Customer ID and message content are required." })
    }

    const log = await billingModule.createBillingMessageLogs({
      customer_id,
      invoice_id: invoice_id || null,
      channel: channel || "whatsapp",
      message_type: message_type || "payment_reminder",
      message_content,
      sent_by: sent_by || null,
      delivery_status: delivery_status || "sent",
      provider_message_id: provider_message_id || null,
    })

    res.status(201).json({ message_log: log })
  } catch (error: any) {
    console.error("Create message log error:", error)
    res.status(400).json({ error: error.message || "Failed to log message." })
  }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const messages = await billingModule.listBillingMessageLogs(
      {},
      {
        relations: ["customer"],
        order: { created_at: "DESC" },
      }
    )
    res.json({ messages })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch messages." })
  }
}

// Admin authentication enforced by Medusa default for /admin/* routes.
