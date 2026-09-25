import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../modules/billing"
import BillingModuleService from "../../../../../modules/billing/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const id = req.params.id
    const estimate = await billingModule.retrieveBillingEstimate(id, {
      relations: ["items", "customer"],
    })
    res.json({ estimate })
  } catch (error: any) {
    res.status(404).json({ error: "Estimate not found." })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const id = req.params.id
    const { status, notes, valid_until } = req.body as any
    const updateData: any = {}
    
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (valid_until !== undefined) updateData.valid_until = new Date(valid_until)

    const estimate = await billingModule.updateBillingEstimates({
      id,
      ...updateData
    })
    res.json({ estimate })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to update estimate." })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const id = req.params.id
    // Instead of actually deleting, we typically mark as REJECTED or EXPIRED
    const estimate = await billingModule.updateBillingEstimates({
      id,
      status: "REJECTED"
    })
    res.json({ estimate })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to delete estimate." })
  }
}
