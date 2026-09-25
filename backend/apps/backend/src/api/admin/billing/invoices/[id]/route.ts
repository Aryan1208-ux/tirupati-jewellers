import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../modules/billing"
import BillingModuleService from "../../../../../modules/billing/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  const id = req.params.id

  try {
    const [invoice] = await billingModule.listBillingInvoices(
      { id },
      { relations: ["items", "customer", "payments"] }
    )

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." })
    }

    res.json({ invoice })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch invoice." })
  }
}

export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  const id = req.params.id

  try {
    const { due_date, reminder_enabled } = req.body as any

    const updated = await billingModule.updateBillingInvoices({
      id,
      ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
      ...(reminder_enabled !== undefined && { reminder_enabled }),
    })

    res.json({ invoice: updated })
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to update invoice." })
  }
}

// Admin authentication enforced by Medusa default for /admin/* routes.
