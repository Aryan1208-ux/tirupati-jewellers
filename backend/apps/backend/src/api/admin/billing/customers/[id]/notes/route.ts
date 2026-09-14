import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../../modules/billing"
import BillingModuleService from "../../../../../../modules/billing/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  const customerId = req.params.id

  try {
    const notes = await billingModule.listBillingCustomerNotes(
      { customer: { id: customerId } },
      { order: { created_at: "DESC" } }
    )
    res.json({ notes })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch notes." })
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  const customerId = req.params.id

  try {
    const { note, created_by } = req.body as any

    if (!note || !note.trim()) {
      return res.status(400).json({ error: "Note text is required." })
    }

    const created = await billingModule.createBillingCustomerNotes({
      note: note.trim(),
      created_by: created_by || null,
      customer_id: customerId,
    })

    res.status(201).json({ note: created })
  } catch (error: any) {
    console.error("Create note error:", error)
    res.status(400).json({ error: error.message || "Failed to create note." })
  }
}

export const AUTHENTICATE = false;
