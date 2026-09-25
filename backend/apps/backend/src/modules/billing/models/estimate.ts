import { model } from "@medusajs/framework/utils"
import { BillingCustomer } from "./invoice"

// ─── Estimate ───────────────────────────────────────────────────────────────

export const BillingEstimate = model.define("billing_estimate", {
  id: model.id().primaryKey(),
  estimate_number: model.text().unique(),
  customer_type: model.enum(["b2c", "b2b"]).default("b2c"),
  customer_name: model.text(),
  mobile_number: model.text().nullable(),
  address: model.text().nullable(),
  city: model.text().nullable(),
  state: model.text().nullable(),
  state_code: model.text().nullable(),
  pin_code: model.text().nullable(),
  gstin: model.text().nullable(),

  subtotal: model.bigNumber(),
  discount: model.bigNumber().default(0),
  taxable_amount: model.bigNumber(),

  cgst: model.bigNumber().default(0),
  sgst: model.bigNumber().default(0),
  igst: model.bigNumber().default(0),

  round_off: model.bigNumber().default(0),
  grand_total: model.bigNumber(),

  valid_until: model.dateTime().nullable(),
  notes: model.text().nullable(),

  status: model.enum(["DRAFT", "ISSUED", "CONVERTED", "EXPIRED", "REJECTED"]).default("ISSUED"),
  
  created_by: model.text().nullable(),
  converted_to_invoice_id: model.text().nullable(),

  items: model.hasMany(() => BillingEstimateItem, {
    mappedBy: "estimate",
  }),
  customer: model.belongsTo(() => BillingCustomer, {
    mappedBy: "estimates",
  }),
})

// ─── Estimate Item ──────────────────────────────────────────────────────────

export const BillingEstimateItem = model.define("billing_estimate_item", {
  id: model.id().primaryKey(),
  product_id: model.text().nullable(),
  product_name: model.text(),
  sku: model.text().nullable(),
  hsn: model.text().nullable(),
  quantity: model.number(),

  gross_weight: model.text().nullable(),
  net_weight: model.text().nullable(),
  purity: model.text().nullable(),

  rate: model.bigNumber(),
  discount: model.bigNumber().default(0),
  taxable_value: model.bigNumber(),

  gst_rate: model.number(),
  gst_amount: model.bigNumber(),
  total: model.bigNumber(),

  estimate: model.belongsTo(() => BillingEstimate, {
    mappedBy: "items",
  }),
})
