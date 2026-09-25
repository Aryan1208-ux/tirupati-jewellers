import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export default async function myScript({ container }: { container: any }) {
  const query = container.resolve("query")
  
  const { data: activities } = await query.graph({
    entity: "customer_activity",
    fields: ["id", "event_type", "anonymous_id", "product_id", "created_at", "metadata"]
  })
  
  console.log(`Found ${activities.length} activities:`)
  console.log(activities)
}
