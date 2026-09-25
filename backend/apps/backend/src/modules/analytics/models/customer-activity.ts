import { model } from "@medusajs/framework/utils"

export const CustomerActivity = model.define("customer_activity", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  anonymous_id: model.text().nullable(),
  session_id: model.text().nullable(),
  event_type: model.text(),
  product_id: model.text().nullable(),
  variant_id: model.text().nullable(),
  category_id: model.text().nullable(),
  search_query: model.text().nullable(),
  page_path: model.text().nullable(),
  metadata: model.json().nullable(),
})
