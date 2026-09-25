import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/medusa"
import { capturePaymentWorkflow } from "@medusajs/core-flows"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")

  // Fetch the order with its payment collections and payments
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "payment_collections.*",
      "payment_collections.payments.*",
    ],
    filters: {
      id: data.id,
    },
  })

  const order = orders[0]
  if (!order) {
    return
  }

  // Iterate over payment collections and payments to capture them
  for (const collection of order.payment_collections || []) {
    if (!collection) continue
    for (const payment of collection.payments || []) {
      if (!payment) continue
      // If it's already captured, skip
      if (payment.captured_at) {
        continue
      }
      
      try {
        console.log(`Auto-capturing payment ${payment.id} for order ${order.id}...`)
        await capturePaymentWorkflow(container).run({
          input: {
            payment_id: payment.id,
            captured_by: "system_auto_capture",
          },
        })
        console.log(`Payment ${payment.id} captured successfully.`)
      } catch (err) {
        console.error(`Failed to auto-capture payment ${payment.id}:`, err)
      }
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
