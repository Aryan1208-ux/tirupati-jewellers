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
    const [customer] = await billingModule.listBillingCustomers(
      { id },
      {
        relations: ["invoices", "invoices.items", "payments", "notes", "follow_ups", "message_logs"],
      }
    )

    if (!customer) {
      return res.status(404).json({ error: "Customer not found." })
    }

    // Compute summary
    const invoices = customer.invoices || []
    const activeInvoices = invoices.filter((inv: any) => inv.payment_status !== "CANCELLED")
    const totalPurchases = activeInvoices.reduce((s: number, inv: any) => s + Number(inv.grand_total), 0)
    const totalPaid = activeInvoices.reduce((s: number, inv: any) => s + Number(inv.amount_paid || 0), 0)
    const outstanding = totalPurchases - totalPaid

    // Sort invoices by date DESC
    const sortedInvoices = [...invoices].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Sort payments by date DESC
    const sortedPayments = [...(customer.payments || [])].sort(
      (a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    )

    // Sort notes by date DESC
    const sortedNotes = [...(customer.notes || [])].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Sort follow-ups by date ASC (upcoming first)
    const sortedFollowUps = [...(customer.follow_ups || [])].sort(
      (a: any, b: any) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime()
    )

    // Sort messages by date DESC
    const sortedMessages = [...(customer.message_logs || [])].sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    res.json({
      customer: {
        ...customer,
        invoices: sortedInvoices,
        payments: sortedPayments,
        notes: sortedNotes,
        follow_ups: sortedFollowUps,
        message_logs: sortedMessages,
      },
      summary: {
        total_purchases: totalPurchases,
        total_paid: totalPaid,
        outstanding,
        invoice_count: activeInvoices.length,
        last_purchase: sortedInvoices[0]?.created_at || null,
      },
    })
  } catch (error: any) {
    console.error("Get customer error:", error)
    res.status(500).json({ error: "Failed to fetch customer." })
  }
}

export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  const id = req.params.id

  try {
    const {
      name, mobile, email, address, city, state, state_code,
      pin_code, gstin, customer_type, status,
    } = req.body as any

    const updated = await billingModule.updateBillingCustomers({
      id,
      ...(name !== undefined && { name }),
      ...(mobile !== undefined && { mobile }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(state_code !== undefined && { state_code }),
      ...(pin_code !== undefined && { pin_code }),
      ...(gstin !== undefined && { gstin }),
      ...(customer_type !== undefined && { customer_type }),
      ...(status !== undefined && { status }),
    })

    res.json({ customer: updated })
  } catch (error: any) {
    console.error("Update customer error:", error)
    res.status(400).json({ error: error.message || "Failed to update customer." })
  }
}

export const AUTHENTICATE = false;
