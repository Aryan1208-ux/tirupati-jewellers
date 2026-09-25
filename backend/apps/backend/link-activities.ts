import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export default async function myScript({ container }: { container: any }) {
  const query = container.resolve("query")
  
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email"]
  })
  
  if (customers.length > 0) {
    const custId = customers[0].id
    console.log("Linking activities to customer:", custId)
    
    // We can't easily update via GraphQL, we use the analytics module directly
    const analyticsService = container.resolve("analytics")
    
    const activities = await analyticsService.listCustomerActivities({})
    console.log(`Found ${activities.length} activities to link`)
    
    for (const act of activities) {
      await analyticsService.updateCustomerActivities(act.id, {
        customer_id: custId
      })
    }
    
    console.log("Linked successfully!")
  } else {
    console.log("No customers found in DB to link to.")
  }
}
