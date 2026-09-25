import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../modules/billing"
import BillingModuleService from "../../../../modules/billing/service"
import { isValidStateCode, INDIA_STATES } from "../../../../modules/billing/utils/state-codes"

// Simple in-process mutex to prevent concurrent invoice number generation
// For multi-instance deployments, use a DB-level advisory lock instead.
let sequenceLock = false

async function acquireSequenceLock(timeout = 5000): Promise<void> {
  const start = Date.now()
  while (sequenceLock) {
    if (Date.now() - start > timeout) throw new Error("Invoice sequence lock timeout")
    await new Promise(r => setTimeout(r, 50))
  }
  sequenceLock = true
}

function releaseSequenceLock() {
  sequenceLock = false
}

/**
 * Generate the current Indian Financial Year string.
 * April (month index 3) starts the new FY.
 * e.g., if today is Aug 2026 → "2026-27"
 *     if today is Jan 2026 → "2025-26"
 */
function getCurrentFinancialYear(): string {
  const now = new Date()
  const month = now.getMonth() // 0 = Jan, 3 = Apr
  const year = now.getFullYear()
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(2)}`
  }
  return `${year - 1}-${String(year).slice(2)}`
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const {
      customer_type,
      customer_name,
      mobile_number,
      email,
      address,
      city,
      state,
      state_code,
      pin_code,
      gstin,
      payment_method,
      payment_status = "PAID",
      due_date,
      reminder_enabled,
      document_type = "INV",
      supply_type = "B2C",
      items,
    } = req.body as any

    // ── Validate required fields ─────────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one line item is required." })
    }
    if (customer_type === "b2b" && (!gstin || gstin.length !== 15)) {
      return res.status(400).json({ error: "Valid 15-character GSTIN is required for B2B invoices." })
    }
    if (state_code && !isValidStateCode(state_code)) {
      return res.status(400).json({ error: `Invalid state code: ${state_code}. Must be a valid 2-digit Indian state code.` })
    }

    // ── Auto-create or find customer ─────────────────────────────────────────
    let customerId: string | null = null
    const custName = (customer_name || "").trim()

    if (custName && custName !== "Cash Customer") {
      // Try to match by mobile first
      if (mobile_number && mobile_number.trim()) {
        const existing = await billingModule.listBillingCustomers({
          mobile: mobile_number.trim(),
        })
        if (existing.length > 0) {
          customerId = existing[0].id
          // Update customer info if needed
          await billingModule.updateBillingCustomers({
            id: customerId,
            name: custName || existing[0].name,
            ...(email && { email }),
            ...(address && { address }),
            ...(city && { city }),
            ...(state && { state }),
            ...(state_code && { state_code }),
            ...(pin_code && { pin_code }),
            ...(gstin && { gstin }),
            ...(customer_type && { customer_type }),
          })
        }
      }

      // Create new customer if not found
      if (!customerId) {
        const newCustomer = await billingModule.createBillingCustomers({
          name: custName,
          mobile: mobile_number?.trim() || null,
          email: email?.trim() || null,
          address: address || null,
          city: city || null,
          state: state || null,
          state_code: state_code || null,
          pin_code: pin_code || null,
          gstin: gstin || null,
          customer_type: customer_type || "b2c",
          status: payment_status === "PAID" ? "ACTIVE" : "PAYMENT_PENDING",
        })
        customerId = newCustomer.id
      }
    }

    // ── Acquire sequence lock to prevent duplicate invoice numbers ───────────
    await acquireSequenceLock()

    let invoiceNumber: string
    try {
      let [settings] = await billingModule.listBillingSettings()
      if (!settings) {
        settings = await billingModule.createBillingSettings({
          business_name: "Tirupati Jewellers",
          invoice_prefix: "TJ/",
          financial_year: getCurrentFinancialYear(),
          state_code: "07",
        })
      }

      // Auto-update financial year if year has rolled over
      const currentFY = getCurrentFinancialYear()
      if (settings.financial_year !== currentFY) {
        settings = await billingModule.updateBillingSettings({
          id: settings.id,
          financial_year: currentFY,
          next_invoice_sequence: 1, // Reset sequence for new FY
        })
      }

      const sequenceNum = settings.next_invoice_sequence.toString().padStart(6, "0")
      invoiceNumber = `${settings.invoice_prefix}${settings.financial_year}/${sequenceNum}`

      // Increment sequence atomically before releasing lock
      await billingModule.updateBillingSettings({
        id: settings.id,
        next_invoice_sequence: settings.next_invoice_sequence + 1,
      })
    } finally {
      releaseSequenceLock()
    }

    // ── Server-side total recalculation (never trust client) ─────────────────
    let subtotal = 0
    let totalDiscount = 0
    let taxable_amount = 0
    let cgst = 0
    let sgst = 0
    let igst = 0

    const [billingSettings] = await billingModule.listBillingSettings()
    const shopStateCode = billingSettings?.state_code || "07"
    const isIntraState = shopStateCode === state_code

    for (const item of items) {
      if (!item.product_name || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: `Invalid quantity or missing product name in line item.` })
      }

      const lineSubtotal = Number(item.rate) * Number(item.quantity)
      const lineDiscount = Math.min(Number(item.discount || 0), lineSubtotal) // never discount > price
      
      let lineTaxable = 0
      let lineGst = 0
      if (item.is_tax_inclusive) {
        const finalAmountAfterDiscount = lineSubtotal - lineDiscount
        lineTaxable = finalAmountAfterDiscount / (1 + (Number(item.gst_rate || 0) / 100))
        lineGst = finalAmountAfterDiscount - lineTaxable
      } else {
        lineTaxable = lineSubtotal - lineDiscount
        lineGst = lineTaxable * (Number(item.gst_rate || 0) / 100)
      }

      subtotal += lineSubtotal
      totalDiscount += lineDiscount
      taxable_amount += lineTaxable

      if (isIntraState) {
        cgst += lineGst / 2
        sgst += lineGst / 2
      } else {
        igst += lineGst
      }
    }

    const rawTotal = taxable_amount + cgst + sgst + igst
    const grand_total = Math.round(rawTotal)
    const round_off = grand_total - rawTotal

    // ── Determine amount_paid based on payment_status ────────────────────────
    let amount_paid = 0
    if (payment_status === "PAID") {
      amount_paid = grand_total
    }

    // ── Format line items for storage ────────────────────────────────────────
    const formattedItems = items.map((item: any) => {
      const lineSubtotal = Number(item.rate) * Number(item.quantity)
      const lineDiscount = Math.min(Number(item.discount || 0), lineSubtotal)
      
      let lineTaxable = 0
      let lineGst = 0
      if (item.is_tax_inclusive) {
        const finalAmountAfterDiscount = lineSubtotal - lineDiscount
        lineTaxable = finalAmountAfterDiscount / (1 + (Number(item.gst_rate || 0) / 100))
        lineGst = finalAmountAfterDiscount - lineTaxable
      } else {
        lineTaxable = lineSubtotal - lineDiscount
        lineGst = lineTaxable * (Number(item.gst_rate || 0) / 100)
      }
      return {
        product_id: item.product_id || null,
        product_name: item.product_name,
        sku: item.sku || null,
        hsn: item.hsn || null,
        quantity: Number(item.quantity),
        gross_weight: item.gross_weight || null,
        net_weight: item.net_weight || null,
        purity: item.purity || null,
        rate: Number(item.rate),
        discount: lineDiscount,
        taxable_value: lineTaxable,
        gst_rate: Number(item.gst_rate || 0),
        gst_amount: lineGst,
        total: lineTaxable + lineGst,
      }
    })

    // ── Check for active festival for Bill Greeting ────────────────────────────
    let festival_id: string | null = null
    let festival_name: string | null = null
    let festival_greeting_text: string | null = null
    let festival_template_id: string | null = null

    try {
      const today = new Date()
      const allOccasions = await billingModule.listBillingGreetingOccasions({ is_active: true, enable_on_bill: true })
      const activeFestival = allOccasions.find(occ => {
        const start = new Date(occ.start_date)
        const end = new Date(occ.end_date)
        start.setHours(0,0,0,0)
        end.setHours(23,59,59,999)
        return today.getTime() >= start.getTime() && today.getTime() <= end.getTime()
      })

      if (activeFestival && activeFestival.bill_greeting_text) {
        festival_id = activeFestival.id
        festival_name = activeFestival.name
        festival_greeting_text = activeFestival.bill_greeting_text
        
        // Find if there is an associated template for snapshotting purposes, though text is primary
        const templates = await billingModule.listBillingGreetingTemplates({ is_active: true, occasion_type: "FESTIVAL" })
        if (templates.length > 0) {
          festival_template_id = templates[0].id
        }
      }
    } catch (e) {
      console.error("Failed to inject festival greeting:", e)
    }

    // ── Save invoice atomically ──────────────────────────────────────────────
    const invoice = await billingModule.createBillingInvoices({
      invoice_number: invoiceNumber,
      customer_type: (customer_type || "b2c") as "b2c" | "b2b",
      customer_name: custName || "Cash Customer",
      mobile_number: mobile_number || null,
      address: address || null,
      city: city || null,
      state: state || null,
      state_code: state_code || null,
      pin_code: pin_code || null,
      gstin: gstin || null,
      subtotal,
      discount: totalDiscount,
      taxable_amount,
      cgst,
      sgst,
      igst,
      round_off,
      grand_total,
      amount_paid,
      due_date: due_date ? new Date(due_date) : null,
      reminder_enabled: reminder_enabled || false,
      payment_method: payment_method || "Cash",
      payment_status: payment_status as "PAID" | "PARTIALLY_PAID" | "PENDING" | "CANCELLED",
      customer_id: customerId ?? undefined,
      document_type,
      supply_type: customer_type === "b2b" ? "B2B" : "B2C",
      e_invoice_status: "NOT_APPLICABLE",
      festival_id,
      festival_name,
      festival_greeting_text,
      festival_template_id,
    })

    // Create line items linked to the invoice
    for (const item of formattedItems) {
      await billingModule.createBillingInvoiceItems({
        ...item,
        invoice_id: invoice.id,
      })
    }

    // If paid, also create a payment record
    if (payment_status === "PAID" && grand_total > 0) {
      await billingModule.createBillingPayments({
        amount: grand_total,
        payment_method: payment_method || "Cash",
        payment_date: new Date(),
        recorded_by: undefined,
        invoice_id: invoice.id,
        customer_id: customerId ?? undefined,
      })
    }

    // Update customer status
    if (customerId && payment_status !== "PAID") {
      await billingModule.updateBillingCustomers({
        id: customerId,
        status: "PAYMENT_PENDING",
      })
    }

    res.json({ invoice })
  } catch (error: any) {
    console.error("Invoice creation error:", error)
    res.status(400).json({ error: error.message || "Failed to create invoice." })
  }
}

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
    res.json({ invoices })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch invoices." })
  }
}

// Medusa admin authentication is enabled by default for /admin/* routes.
// No AUTHENTICATE export needed — Medusa enforces admin JWT auth.
