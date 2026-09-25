import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BILLING_MODULE } from "../../../../../../modules/billing"
import BillingModuleService from "../../../../../../modules/billing/service"

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const id = req.params.id
    const { name, start_date, end_date, is_active, greeting_text, bill_greeting_text, enable_on_bill } = req.body as any
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (start_date !== undefined) updateData.start_date = new Date(start_date)
    if (end_date !== undefined) updateData.end_date = new Date(end_date)
    if (is_active !== undefined) updateData.is_active = is_active
    if (greeting_text !== undefined) updateData.greeting_text = greeting_text
    if (bill_greeting_text !== undefined) updateData.bill_greeting_text = bill_greeting_text
    if (enable_on_bill !== undefined) updateData.enable_on_bill = enable_on_bill

    const occasion = await billingModule.updateBillingGreetingOccasions({
      id,
      ...updateData
    })
    res.json({ occasion })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to update occasion." })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const billingModule = req.scope.resolve<BillingModuleService>(BILLING_MODULE)
  try {
    const id = req.params.id
    await billingModule.deleteBillingGreetingOccasions(id)
    res.json({ success: true })
  } catch (error: any) {
    res.status(400).json({ error: "Failed to delete occasion." })
  }
}
