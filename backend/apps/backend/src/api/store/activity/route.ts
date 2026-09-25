import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { randomUUID } from "crypto"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const analyticsService = req.scope.resolve("analytics") as any

    // 1. Resolve Customer ID (if authenticated via Medusa JWT/session)
    const customerId = (req as any).auth_context?.actor_id || null;

    // 2. Resolve or Create Anonymous ID via Cookie
    let anonymousId = req.cookies?.tj_visitor_id
    if (!anonymousId) {
      anonymousId = randomUUID()
      // Set secure cookie for anonymous tracking
      res.cookie("tj_visitor_id", anonymousId, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
    }

    const {
      event_type,
      product_id,
      variant_id,
      category_id,
      search_query,
      page_path,
      session_id,
      metadata,
    } = req.body as any

    if (!event_type) {
      return res.status(400).json({ error: "event_type is required" })
    }

    // 3. Store Event
    await analyticsService.createCustomerActivities({
      customer_id: customerId,
      anonymous_id: anonymousId,
      session_id: session_id || null, // from client if they maintain session
      event_type,
      product_id: product_id || null,
      variant_id: variant_id || null,
      category_id: category_id || null,
      search_query: search_query || null,
      page_path: page_path || null,
      metadata: metadata || null,
    })

    res.status(200).json({ success: true })
  } catch (err: any) {
    console.error("Activity tracking error:", err)
    // Always return 200 to client for best-effort tracking even on error
    res.status(200).json({ success: false, error: "Internal tracking error" })
  }
}
