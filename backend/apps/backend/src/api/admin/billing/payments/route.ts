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
      invoice_id,
      customer_id,
      amount,
      payment_method,
      reference_number,
      recorded_by,
      notes,
      payment_date,
    } = req.body as any

    if (!invoice_id || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invoice ID and a positive amount are required." })
    }

    // Fetch the invoice to validate
    const [invoice] = await billingModule.listBillingInvoices({ id: invoice_id })
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." })
    }

    if (invoice.payment_status === "CANCELLED") {
      return res.status(400).json({ error: "Cannot record payment on a cancelled invoice." })
    }

    const currentPaid = Number(invoice.amount_paid || 0)
    const grandTotal = Number(invoice.grand_total)
    const paymentAmount = Number(amount)

    if (currentPaid + paymentAmount > grandTotal) {
      return res.status(400).json({
        error: `Payment amount exceeds outstanding balance. Outstanding: ₹${(grandTotal - currentPaid).toFixed(2)}`,
      })
    }

    // Create payment record
    const payment = await billingModule.createBillingPayments({
      amount: paymentAmount,
      payment_method: payment_method || "Cash",
      reference_number: reference_number || null,
      recorded_by: recorded_by || null,
      notes: notes || null,
      payment_date: payment_date ? new Date(payment_date) : new Date(),
      invoice_id,
      customer_id: customer_id || undefined,
    })

    // Update invoice amount_paid and payment_status
    const newPaid = currentPaid + paymentAmount
    let newStatus = "PARTIALLY_PAID"
    if (newPaid >= grandTotal) {
      newStatus = "PAID"
    }

    const typedStatus = newStatus as "PAID" | "PARTIALLY_PAID" | "PENDING" | "CANCELLED"

    await billingModule.updateBillingInvoices({
      id: invoice_id,
      amount_paid: newPaid,
      payment_status: typedStatus,
      // If fully paid, disable reminders
      ...(typedStatus === "PAID" && { reminder_enabled: false }),
    })

    // Update customer status if fully paid
    if (customer_id && newStatus === "PAID") {
      // Check if customer has any other outstanding invoices
      const customerInvoices = await billingModule.listBillingInvoices({
        customer: { id: customer_id },
      })
      const hasOutstanding = customerInvoices.some(inv => {
        if (inv.id === invoice_id || inv.payment_status === "CANCELLED") return false
        return Number(inv.grand_total) - Number(inv.amount_paid || 0) > 0
      })

      if (!hasOutstanding) {
        await billingModule.updateBillingCustomers({
          id: customer_id,
          status: "PAID",
        })
      }
    }

    res.status(201).json({ payment, new_status: newStatus, new_paid: newPaid })
  } catch (error: any) {
    console.error("Record payment error:", error)
    res.status(400).json({ error: error.message || "Failed to record payment." })
  }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const payments = await billingModule.listBillingPayments(
      {},
      {
        relations: ["invoice", "customer"],
        order: { payment_date: "DESC" },
      }
    )
    res.json({ payments })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch payments." })
  }
}

export const AUTHENTICATE = false;
