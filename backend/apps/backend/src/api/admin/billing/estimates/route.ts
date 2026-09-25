import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../modules/billing"
import BillingModuleService from "../../../../modules/billing/service"
import { isValidStateCode } from "../../../../modules/billing/utils/state-codes"

let estimateSequenceLock = false

async function acquireSequenceLock(timeout = 5000): Promise<void> {
  const start = Date.now()
  while (estimateSequenceLock) {
    if (Date.now() - start > timeout) throw new Error("Estimate sequence lock timeout")
    await new Promise(r => setTimeout(r, 50))
  }
  estimateSequenceLock = true
}

function releaseSequenceLock() {
  estimateSequenceLock = false
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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const estimates = await billingModule.listBillingEstimates({}, {
      relations: ["items", "customer"],
      order: { created_at: "DESC" },
    })
    res.json({ estimates })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch estimates." })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
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
      valid_until,
      notes,
      items,
    } = req.body as any

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one line item is required." })
    }
    if (customer_type === "b2b" && (!gstin || gstin.length !== 15)) {
      return res.status(400).json({ error: "Valid 15-character GSTIN is required for B2B estimates." })
    }
    if (state_code && !isValidStateCode(state_code)) {
      return res.status(400).json({ error: `Invalid state code: ${state_code}.` })
    }

    let customerId: string | null = null
    const custName = (customer_name || "").trim()

    if (custName && custName !== "Cash Customer") {
      if (mobile_number && mobile_number.trim()) {
        const existing = await billingModule.listBillingCustomers({ mobile: mobile_number.trim() })
        if (existing.length > 0) {
          customerId = existing[0].id
        }
      }
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
        })
        customerId = newCustomer.id
      }
    }

    await acquireSequenceLock()
    let estimateNumber: string
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
      const currentFY = getCurrentFinancialYear()
      if (settings.financial_year !== currentFY) {
        settings = await billingModule.updateBillingSettings({
          id: settings.id,
          financial_year: currentFY,
          next_invoice_sequence: 1, 
        })
      }

      // Generate a unique estimate number. We'll use EXT/ instead of TJ/ to distinguish
      const count = await billingModule.listBillingEstimates()
      const sequenceNum = (count.length + 1).toString().padStart(6, "0")
      estimateNumber = `EST/${settings.financial_year}/${sequenceNum}`

    } finally {
      releaseSequenceLock()
    }

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

    const estimate = await billingModule.createBillingEstimates({
      estimate_number: estimateNumber,
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
      valid_until: valid_until ? new Date(valid_until) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      notes: notes || null,
      status: "ISSUED",
      customer_id: customerId ?? undefined,
    })

    for (const item of formattedItems) {
      await billingModule.createBillingEstimateItems({
        ...item,
        estimate_id: estimate.id,
      })
    }

    res.json({ estimate })
  } catch (error: any) {
    console.error("Estimate creation error:", error)
    res.status(400).json({ error: error.message || "Failed to create estimate." })
  }
}
