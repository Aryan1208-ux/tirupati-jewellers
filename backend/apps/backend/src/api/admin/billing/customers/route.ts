import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../modules/billing"
import BillingModuleService from "../../../../modules/billing/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const { q, status, filter } = req.query as any

    let filters: any = {}

    if (status && status !== "ALL") {
      filters.status = status
    }

    let customers = await billingModule.listBillingCustomers(
      filters,
      {
        relations: ["invoices", "payments"],
        order: { created_at: "DESC" },
      }
    )

    // Search filter (name, mobile, email, gstin)
    if (q && typeof q === "string" && q.trim().length > 0) {
      const query = q.toLowerCase().trim()
      customers = customers.filter(c => {
        const nameMatch = c.name?.toLowerCase().includes(query)
        const mobileMatch = (c.mobile || "").includes(query)
        const emailMatch = (c.email || "").toLowerCase().includes(query)
        const gstinMatch = (c.gstin || "").toLowerCase().includes(query)
        // Also search by invoice number
        const invoiceMatch = c.invoices?.some(
          (inv: any) => (inv.invoice_number || "").toLowerCase().includes(query)
        )
        return nameMatch || mobileMatch || emailMatch || gstinMatch || invoiceMatch
      })
    }

    // Additional filter types
    if (filter === "pending_payment") {
      customers = customers.filter(c => {
        const outstanding = (c.invoices || []).reduce((sum: number, inv: any) => {
          if (inv.payment_status === "CANCELLED") return sum
          return sum + Number(inv.grand_total) - Number(inv.amount_paid || 0)
        }, 0)
        return outstanding > 0
      })
    }

    // Compute summary stats for each customer
    const enriched = customers.map(c => {
      const invoices = c.invoices || []
      const totalPurchases = invoices.reduce((s: number, inv: any) =>
        inv.payment_status !== "CANCELLED" ? s + Number(inv.grand_total) : s, 0)
      const totalPaid = invoices.reduce((s: number, inv: any) =>
        inv.payment_status !== "CANCELLED" ? s + Number(inv.amount_paid || 0) : s, 0)
      const outstanding = totalPurchases - totalPaid
      const lastPurchase = invoices.length > 0
        ? invoices.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
        : null

      return {
        ...c,
        invoice_count: invoices.filter((inv: any) => inv.payment_status !== "CANCELLED").length,
        total_purchases: totalPurchases,
        total_paid: totalPaid,
        outstanding,
        last_purchase: lastPurchase,
      }
    })

    res.json({ customers: enriched })
  } catch (error: any) {
    console.error("List customers error:", error)
    res.status(500).json({ error: "Failed to fetch customers." })
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const {
      name,
      mobile,
      email,
      address,
      city,
      state,
      state_code,
      pin_code,
      gstin,
      customer_type,
    } = req.body as any

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Customer name is required." })
    }

    // Check for duplicate by mobile if provided
    if (mobile && mobile.trim()) {
      const existing = await billingModule.listBillingCustomers({ mobile: mobile.trim() })
      if (existing.length > 0) {
        return res.status(409).json({
          error: "A customer with this mobile number already exists.",
          existing_customer: existing[0],
        })
      }
    }

    const customer = await billingModule.createBillingCustomers({
      name: name.trim(),
      mobile: mobile?.trim() || null,
      email: email?.trim() || null,
      address: address || null,
      city: city || null,
      state: state || null,
      state_code: state_code || null,
      pin_code: pin_code || null,
      gstin: gstin || null,
      customer_type: customer_type || "b2c",
      status: "ACTIVE",
    })

    res.status(201).json({ customer })
  } catch (error: any) {
    console.error("Create customer error:", error)
    res.status(400).json({ error: error.message || "Failed to create customer." })
  }
}

export const AUTHENTICATE = false;
