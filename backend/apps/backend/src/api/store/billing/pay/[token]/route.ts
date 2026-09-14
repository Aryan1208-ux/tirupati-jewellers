import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../modules/billing"
import BillingModuleService from "../../../../../modules/billing/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  const token = req.params.token

  try {
    const [link] = await billingModule.listBillingPaymentLinks({ token })

    if (!link) {
      return res.status(404).json({ error: "Payment link not found." })
    }

    if (link.status === "USED") {
      return res.status(410).json({ error: "This payment link has already been used." })
    }

    if (link.status === "EXPIRED" || new Date(link.expires_at) < new Date()) {
      // Auto-expire if past date
      if (link.status !== "EXPIRED") {
        await billingModule.updateBillingPaymentLinks({
          id: link.id,
          status: "EXPIRED",
        })
      }
      return res.status(410).json({ error: "This payment link has expired." })
    }

    // Fetch the invoice details (amount determined server-side)
    const [invoice] = await billingModule.listBillingInvoices(
      { id: link.invoice_id },
      { relations: ["items"] }
    )

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." })
    }

    const outstanding = Number(invoice.grand_total) - Number(invoice.amount_paid || 0)

    // Fetch billing settings for business name
    const [settings] = await billingModule.listBillingSettings()

    res.json({
      payment: {
        token: link.token,
        invoice_number: invoice.invoice_number,
        customer_name: invoice.customer_name,
        grand_total: Number(invoice.grand_total),
        amount_paid: Number(invoice.amount_paid || 0),
        outstanding,
        items: invoice.items,
        business_name: settings?.business_name || "Tirupati Jewellers",
        business_phone: settings?.phone || null,
      },
    })
  } catch (error: any) {
    console.error("Resolve payment link error:", error)
    res.status(500).json({ error: "Failed to resolve payment link." })
  }
}
