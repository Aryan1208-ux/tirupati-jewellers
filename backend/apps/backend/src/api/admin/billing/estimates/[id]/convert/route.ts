import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../../modules/billing"
import BillingModuleService from "../../../../../../modules/billing/service"

let invoiceSequenceLock = false

async function acquireSequenceLock(timeout = 5000): Promise<void> {
  const start = Date.now()
  while (invoiceSequenceLock) {
    if (Date.now() - start > timeout) throw new Error("Invoice sequence lock timeout")
    await new Promise(r => setTimeout(r, 50))
  }
  invoiceSequenceLock = true
}

function releaseSequenceLock() {
  invoiceSequenceLock = false
}

function getCurrentFinancialYear(): string {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(2)}`
  }
  return `${year - 1}-${String(year).slice(2)}`
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const id = req.params.id

    // 1. Fetch Estimate
    const estimate = await billingModule.retrieveBillingEstimate(id, {
      relations: ["items", "customer"],
    })

    if (!estimate) {
      return res.status(404).json({ error: "Estimate not found." })
    }

    if (estimate.status === "CONVERTED" || estimate.converted_to_invoice_id) {
      return res.status(409).json({ error: "Estimate has already been converted to an invoice." })
    }

    // 2. Generate Invoice Number inside Lock
    await acquireSequenceLock()
    let invoiceNumber: string
    let settings
    try {
      [settings] = await billingModule.listBillingSettings()
      if (!settings) {
        settings = await billingModule.createBillingSettings({
          business_name: "Tirupati Jewellers",
          invoice_prefix: "TJ/",
          financial_year: getCurrentFinancialYear(),
          state_code: "07",
        })
      }

      const currentFY = getCurrentFinancialYear()
      if (settings.financial_year !== currentFY) {
        settings = await billingModule.updateBillingSettings({
          id: settings.id,
          financial_year: currentFY,
          next_invoice_sequence: 1,
        })
      }

      const sequenceNum = settings.next_invoice_sequence.toString().padStart(6, "0")
      invoiceNumber = `${settings.invoice_prefix}${settings.financial_year}/${sequenceNum}`

      await billingModule.updateBillingSettings({
        id: settings.id,
        next_invoice_sequence: settings.next_invoice_sequence + 1,
      })
    } finally {
      releaseSequenceLock()
    }

    // 3. Create Invoice from Estimate Data
    const invoice = await billingModule.createBillingInvoices({
      invoice_number: invoiceNumber,
      customer_type: estimate.customer_type as "b2c" | "b2b",
      customer_name: estimate.customer_name,
      mobile_number: estimate.mobile_number,
      address: estimate.address,
      city: estimate.city,
      state: estimate.state,
      state_code: estimate.state_code,
      pin_code: estimate.pin_code,
      gstin: estimate.gstin,
      subtotal: Number(estimate.subtotal),
      discount: Number(estimate.discount),
      taxable_amount: Number(estimate.taxable_amount),
      cgst: Number(estimate.cgst),
      sgst: Number(estimate.sgst),
      igst: Number(estimate.igst),
      round_off: Number(estimate.round_off),
      grand_total: Number(estimate.grand_total),
      payment_status: "PENDING",
      payment_method: "Cash",
      document_type: "INV",
      supply_type: estimate.customer_type === "b2b" ? "B2B" : "B2C",
      created_by: "Admin (Converted from Estimate)",
      customer_id: estimate.customer_id,
    })

    // 4. Copy Items
    const items = await billingModule.listBillingEstimateItems({ estimate_id: id })
    for (const item of items) {
      await billingModule.createBillingInvoiceItems({
        invoice_id: invoice.id,
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        hsn: item.hsn,
        quantity: Number(item.quantity),
        gross_weight: item.gross_weight,
        net_weight: item.net_weight,
        purity: item.purity,
        rate: Number(item.rate),
        discount: Number(item.discount),
        taxable_value: Number(item.taxable_value),
        gst_rate: Number(item.gst_rate),
        gst_amount: Number(item.gst_amount),
        total: Number(item.total),
      })
    }

    // 5. Mark Estimate as Converted
    await billingModule.updateBillingEstimates({
      id: estimate.id,
      status: "CONVERTED",
      converted_to_invoice_id: invoice.id
    })

    res.status(200).json({ invoice })
  } catch (error: any) {
    console.error("Convert estimate error:", error)
    res.status(500).json({ error: error.message || "Failed to convert estimate." })
  }
}
