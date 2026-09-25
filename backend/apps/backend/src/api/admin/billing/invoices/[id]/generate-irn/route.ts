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
    // 1. Fetch the invoice
    const [invoice] = await billingModule.listBillingInvoices({ id }, { relations: ["items"] })
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." })
    }

    // 2. Fetch business settings to get Seller GSTIN
    const [settings] = await billingModule.listBillingSettings()
    if (!settings || !settings.gstin) {
      return res.status(400).json({ error: "Seller GSTIN is not configured in Business Settings." })
    }

    // 3. Applicability Checks
    if (invoice.e_invoice_status === "GENERATED" && invoice.irn) {
      return res.status(400).json({ error: "E-Invoice has already been generated for this invoice." })
    }
    if (invoice.customer_type !== "b2b") {
      // Typically B2C doesn't get IRN unless explicitly configured for Export/etc.
      // We will allow manual override if requested, but for now block simple B2C.
      if (invoice.supply_type === "B2C") {
         return res.status(400).json({ error: "E-Invoice is not applicable for simple B2C transactions." })
      }
    }

    // 4. Update status to SUBMITTING
    await billingModule.updateBillingInvoices({
      id: invoice.id,
      e_invoice_status: "SUBMITTING",
    })

    // 5. Construct Payload for IRP
    // Note: A real payload builder would map `invoice` directly to the JSON schema required by NIC/ClearTax/IRIS.
    // For now, we pass the raw invoice to the mock provider.
    const payload = {
      Version: "1.1",
      TranDtls: {
        TaxSch: "GST",
        SupTyp: invoice.supply_type,
        RegRev: "N",
        IgstOnIntra: "N"
      },
      DocDtls: {
        Typ: invoice.document_type,
        No: invoice.invoice_number,
        Dt: invoice.created_at.toISOString().split('T')[0] // DD/MM/YYYY formatting needed for real IRP
      },
      // ... mapping continues for SellerDtls, BuyerDtls, ValDtls, ItemList ...
    }

    // 6. Call Provider
    // In production, we'd resolve the provider based on env configuration.
    const provider = new MockEInvoiceProvider()
    const irpResponse = await provider.generateIRN(payload, settings.gstin)

    // 7. Handle Response
    if (irpResponse.Success === "Y") {
      const updatedInvoice = await billingModule.updateBillingInvoices({
        id: invoice.id,
        e_invoice_status: "GENERATED",
        irn: irpResponse.Irn,
        ack_number: irpResponse.AckNo,
        ack_date: irpResponse.AckDt ? new Date(irpResponse.AckDt) : null,
        signed_qr_code: irpResponse.SignedQRCode,
        signed_invoice: irpResponse.SignedInvoice,
        e_invoice_error: null,
        e_invoice_created_at: new Date(),
        provider: "MockEInvoiceProvider",
        environment: process.env.EINVOICE_ENVIRONMENT || "SANDBOX"
      })
      return res.json({ success: true, invoice: updatedInvoice })
    } else {
      await billingModule.updateBillingInvoices({
        id: invoice.id,
        e_invoice_status: "FAILED",
        e_invoice_error: JSON.stringify(irpResponse.ErrorDetails || "Unknown IRP Error"),
      })
      return res.status(400).json({ error: "IRP Registration Failed", details: irpResponse.ErrorDetails })
    }

  } catch (error: any) {
    console.error("IRN Generation Error:", error)
    // Safely update to FAILED if we crashed mid-flight
    await billingModule.updateBillingInvoices({
      id,
      e_invoice_status: "FAILED",
      e_invoice_error: error.message || "Internal Server Error during IRN generation",
    }).catch(() => {})
    
    return res.status(500).json({ error: error.message || "Failed to generate IRN." })
  }
}
