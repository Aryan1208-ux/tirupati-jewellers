import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../../modules/billing"
import BillingModuleService from "../../../../../../modules/billing/service"
import { MockEInvoiceProvider } from "../../../../../../modules/billing/services/einvoice-provider"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  const id = req.params.id

  try {
    const { cancel_reason, cancel_remark } = req.body as { cancel_reason: string, cancel_remark: string }

    if (!cancel_reason || !["1", "2", "3", "4"].includes(cancel_reason)) {
      return res.status(400).json({ error: "Valid cancel reason code is required (1: Duplicate, 2: Data Entry Mistake, 3: Order Cancelled, 4: Other)" })
    }

    // 1. Fetch the invoice
    const [invoice] = await billingModule.listBillingInvoices({ id })
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." })
    }

    // 2. Fetch business settings to get Seller GSTIN
    const [settings] = await billingModule.listBillingSettings()
    if (!settings || !settings.gstin) {
      return res.status(400).json({ error: "Seller GSTIN is not configured in Business Settings." })
    }

    // 3. Applicability Checks
    if (invoice.e_invoice_status !== "GENERATED" || !invoice.irn) {
      return res.status(400).json({ error: "Cannot cancel. This invoice does not have an active IRN." })
    }

    // 4. Update status to SUBMITTING (cancellation pending)
    await billingModule.updateBillingInvoices({
      id: invoice.id,
      e_invoice_status: "SUBMITTING",
    })

    // 5. Call Provider
    const provider = new MockEInvoiceProvider()
    const irpResponse = await provider.cancelIRN(invoice.irn, cancel_reason, cancel_remark || "", settings.gstin)

    // 6. Handle Response
    if (irpResponse.Success === "Y") {
      const updatedInvoice = await billingModule.updateBillingInvoices({
        id: invoice.id,
        e_invoice_status: "CANCELLED",
        e_invoice_cancelled_at: new Date(),
        e_invoice_cancel_reason: `${cancel_reason} - ${cancel_remark}`,
        // Keep the IRN for audit but mark the invoice cancelled
      })
      return res.json({ success: true, invoice: updatedInvoice })
    } else {
      // Revert status to GENERATED if cancellation fails
      await billingModule.updateBillingInvoices({
        id: invoice.id,
        e_invoice_status: "GENERATED",
        e_invoice_error: JSON.stringify(irpResponse.ErrorDetails || "Cancellation Failed"),
      })
      return res.status(400).json({ error: "IRP Cancellation Failed", details: irpResponse.ErrorDetails })
    }

  } catch (error: any) {
    console.error("IRN Cancellation Error:", error)
    // Revert status to GENERATED if we crashed mid-flight
    await billingModule.updateBillingInvoices({
      id,
      e_invoice_status: "GENERATED",
      e_invoice_error: error.message || "Internal Server Error during IRN cancellation",
    }).catch(() => {})
    
    return res.status(500).json({ error: error.message || "Failed to cancel IRN." })
  }
}
