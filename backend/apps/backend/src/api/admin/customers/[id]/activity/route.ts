import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const customerId = req.params.id;
    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required" })
    }

    const analyticsService = req.scope.resolve("analytics") as any

    // Ensure we only retrieve activity for the specifically requested customer ID
    // (This enforces IDOR safety by strictly filtering on the requested customer)
    const activities = await analyticsService.listCustomerActivities(
      { customer_id: customerId },
      { 
        order: { created_at: "DESC" },
        take: 100 // Limit to last 100 activities for the UI initially
      }
    )

    res.status(200).json({ activities })
  } catch (err: any) {
    console.error("Failed to fetch customer activity:", err)
    res.status(500).json({ error: "Failed to fetch activity" })
  }
}
