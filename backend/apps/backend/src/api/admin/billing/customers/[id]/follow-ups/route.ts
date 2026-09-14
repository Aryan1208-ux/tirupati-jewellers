import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../../modules/billing"
import BillingModuleService from "../../../../../../modules/billing/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  const customerId = req.params.id

  try {
    const followUps = await billingModule.listBillingFollowUps(
      { customer: { id: customerId } },
      { order: { follow_up_date: "ASC" } }
    )
    res.json({ follow_ups: followUps })
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch follow-ups." })
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  const customerId = req.params.id

  try {
    const { follow_up_date, reason, assigned_to, notes } = req.body as any

    if (!follow_up_date || !reason?.trim()) {
      return res.status(400).json({ error: "Follow-up date and reason are required." })
    }

    const created = await billingModule.createBillingFollowUps({
      follow_up_date: new Date(follow_up_date),
      reason: reason.trim(),
      assigned_to: assigned_to || null,
      notes: notes || null,
      status: "PENDING",
      customer_id: customerId,
    })

    res.status(201).json({ follow_up: created })
  } catch (error: any) {
    console.error("Create follow-up error:", error)
    res.status(400).json({ error: error.message || "Failed to create follow-up." })
  }
}

export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)

  try {
    const { id, status, notes } = req.body as any

    if (!id) {
      return res.status(400).json({ error: "Follow-up ID is required." })
    }

    const updated = await billingModule.updateBillingFollowUps({
      id,
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
    })

    res.json({ follow_up: updated })
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to update follow-up." })
  }
}

export const AUTHENTICATE = false;
