import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../modules/billing"
import BillingModuleService from "../../../../modules/billing/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const invoices = await billingModule.listBillingInvoices(
      {},
      {
        relations: ["items", "customer"],
        order: { created_at: "DESC" },
      }
    )

    // Filter to only pending/partially paid
    const pending = invoices.filter(inv => {
      if (inv.payment_status === "CANCELLED" || inv.payment_status === "PAID") return false
      const outstanding = Number(inv.grand_total) - Number(inv.amount_paid || 0)
      return outstanding > 0
    })

    // Enrich with outstanding and overdue info
    const now = new Date()
    const enriched = pending.map(inv => {
      const outstanding = Number(inv.grand_total) - Number(inv.amount_paid || 0)
      const isOverdue = inv.due_date ? new Date(inv.due_date) < now : false
      return {
        ...inv,
        outstanding,
        is_overdue: isOverdue,
      }
    })

    res.json({ invoices: enriched })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch pending payments." })
  }
}

export const AUTHENTICATE = false;
