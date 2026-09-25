import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../../modules/billing"
import BillingModuleService from "../../../../../../modules/billing/service"

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const id = req.params.id
    const { name, occasion_type, channel, language, subject, message, is_active } = req.body as any
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (occasion_type !== undefined) updateData.occasion_type = occasion_type
    if (channel !== undefined) updateData.channel = channel
    if (language !== undefined) updateData.language = language
    if (subject !== undefined) updateData.subject = subject
    if (message !== undefined) updateData.message = message
    if (is_active !== undefined) updateData.is_active = is_active

    const template = await billingModule.updateBillingGreetingTemplates({
      id,
      ...updateData
    })
    res.json({ template })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to update template." })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const id = req.params.id
    await billingModule.deleteBillingGreetingTemplates(id)
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to delete template." })
  }
}
