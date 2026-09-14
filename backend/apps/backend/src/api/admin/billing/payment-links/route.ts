import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../modules/billing"
import BillingModuleService from "../../../../modules/billing/service"
import crypto from "crypto"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const { invoice_id, customer_id, expiry_hours } = req.body as any

    if (!invoice_id) {
      return res.status(400).json({ error: "Invoice ID is required." })
    }

    // Validate invoice exists and has outstanding
    const [invoice] = await billingModule.listBillingInvoices({ id: invoice_id })
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found." })
    }

    const outstanding = Number(invoice.grand_total) - Number(invoice.amount_paid || 0)
    if (outstanding <= 0) {
      return res.status(400).json({ error: "Invoice is already fully paid." })
    }

    // Expire any previously active links for this invoice
    const existingLinks = await billingModule.listBillingPaymentLinks({
      invoice_id,
      status: "ACTIVE",
    })
    for (const link of existingLinks) {
      await billingModule.updateBillingPaymentLinks({
        id: link.id,
        status: "EXPIRED",
      })
    }

    // Generate secure non-guessable token
    const token = crypto.randomBytes(32).toString("hex")

    // Default 72 hours expiry
    const hours = expiry_hours || 72
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)

    const paymentLink = await billingModule.createBillingPaymentLinks({
      token,
      invoice_id,
      customer_id: customer_id || null,
      amount: outstanding,
      status: "ACTIVE",
      expires_at: expiresAt,
    })

    // Construct the payment URL
    const baseUrl = process.env.STOREFRONT_URL || process.env.STORE_CORS?.split(",")[0] || "http://localhost:3000"
    const paymentUrl = `${baseUrl}/pay/${token}`

    res.status(201).json({
      payment_link: paymentLink,
      payment_url: paymentUrl,
      outstanding,
    })
  } catch (error: any) {
    console.error("Create payment link error:", error)
    res.status(400).json({ error: error.message || "Failed to create payment link." })
  }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const links = await billingModule.listBillingPaymentLinks(
      {},
      { order: { created_at: "DESC" } }
    )
    res.json({ payment_links: links })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch payment links." })
  }
}

export const AUTHENTICATE = false;
