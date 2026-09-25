import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../modules/billing"
import BillingModuleService from "../../../../modules/billing/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    // Fetch all invoices for calculations
    const invoices = await billingModule.listBillingInvoices(
      {},
      { relations: ["items"] }
    )

    const today = new Date().toISOString().split("T")[0]
    const todaysInvoices = invoices.filter(inv => inv.created_at?.toISOString?.()?.startsWith(today) || String(inv.created_at)?.startsWith(today))

    const todaysSales = todaysInvoices.reduce((s, inv) => s + Number(inv.grand_total), 0)
    const todaysBills = todaysInvoices.length

    // Outstanding = sum of (grand_total - amount_paid) for non-cancelled invoices
    let totalOutstanding = 0
    let overdueCount = 0
    const now = new Date()

    for (const inv of invoices) {
      if (inv.payment_status === "CANCELLED") continue
      const outstanding = Number(inv.grand_total) - Number(inv.amount_paid || 0)
      if (outstanding > 0) {
        totalOutstanding += outstanding
        if (inv.due_date && new Date(inv.due_date) < now) {
          overdueCount++
        }
      }
    }

    // Customer count
    const customers = await billingModule.listBillingCustomers()
    const customerCount = customers.length

    // GST collected today
    const gstCollectedToday = todaysInvoices.reduce(
      (s, inv) => s + Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst),
      0
    )

    const pendingCount = invoices.filter(
      inv => inv.payment_status === "PENDING" || inv.payment_status === "PARTIALLY_PAID"
    ).length

    res.json({
      dashboard: {
        todays_sales: todaysSales,
        todays_bills: todaysBills,
        total_outstanding: totalOutstanding,
        overdue_payments: overdueCount,
        customers: customerCount,
        pending_invoices: pendingCount,
        gst_collected_today: gstCollectedToday,
        total_invoices: invoices.length,
      }
    })
  } catch (error: any) {
    console.error("Dashboard error:", error)
    res.status(500).json({ error: "Failed to load dashboard data." })
  }
}

// Admin authentication enforced by Medusa default for /admin/* routes.
