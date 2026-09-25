import { model } from "@medusajs/framework/utils"
import { BillingEstimate } from "./estimate"
import { BillingGreetingHistory } from "./greetings"

// ─── Customer ───────────────────────────────────────────────────────────────

export const BillingCustomer = model.define("billing_customer", {
  id: model.id().primaryKey(),
  name: model.text(),
  mobile: model.text().nullable(),
  email: model.text().nullable(),
  address: model.text().nullable(),
  city: model.text().nullable(),
  state: model.text().nullable(),
  state_code: model.text().nullable(),
  pin_code: model.text().nullable(),
  gstin: model.text().nullable(),
  customer_type: model.enum(["b2c", "b2b"]).default("b2c"),
  status: model.enum(["ACTIVE", "PAYMENT_PENDING", "PAID", "INACTIVE"]).default("ACTIVE"),

  date_of_birth: model.dateTime().nullable(),
  anniversary_date: model.dateTime().nullable(),
  preferred_greeting_language: model.text().default("en"),
  greeting_opt_in: model.boolean().default(true),
  whatsapp_opt_in: model.boolean().default(true),
  sms_opt_in: model.boolean().default(true),
  email_opt_in: model.boolean().default(true),

  invoices: model.hasMany(() => BillingInvoice, {
    mappedBy: "customer",
  }),
  payments: model.hasMany(() => BillingPayment, {
    mappedBy: "customer",
  }),
  notes: model.hasMany(() => BillingCustomerNote, {
    mappedBy: "customer",
  }),
  follow_ups: model.hasMany(() => BillingFollowUp, {
    mappedBy: "customer",
  }),
  message_logs: model.hasMany(() => BillingMessageLog, {
    mappedBy: "customer",
  }),
  estimates: model.hasMany(() => BillingEstimate, {
    mappedBy: "customer",
  }),
  greetings: model.hasMany(() => BillingGreetingHistory, {
    mappedBy: "customer",
  }),
})

// ─── Invoice (existing, extended) ───────────────────────────────────────────

export const BillingInvoice = model.define("billing_invoice", {
  id: model.id().primaryKey(),
  invoice_number: model.text().unique(),
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

  // New fields for payment tracking
  amount_paid: model.bigNumber().default(0),
  due_date: model.dateTime().nullable(),
  reminder_enabled: model.boolean().default(false),

  payment_method: model.text().nullable(),
  payment_status: model.enum(["PAID", "PARTIALLY_PAID", "PENDING", "CANCELLED"]).default("PENDING"),

  created_by: model.text().nullable(),
  cancelled_by: model.text().nullable(),
  cancellation_reason: model.text().nullable(),

  // E-Invoice Fields
  document_type: model.enum(["INV", "CRN", "DBN"]).default("INV"),
  supply_type: model.enum(["B2B", "B2C", "SEZWP", "SEZWOP", "EXPWP", "EXPWOP", "DEXP"]).default("B2C"),
  e_invoice_status: model.enum(["NOT_APPLICABLE", "PENDING", "SUBMITTING", "GENERATED", "FAILED", "CANCELLED"]).default("NOT_APPLICABLE"),
  irn: model.text().nullable(),
  ack_number: model.text().nullable(),
  ack_date: model.dateTime().nullable(),
  signed_qr_code: model.text().nullable(),
  signed_invoice: model.text().nullable(),
  e_invoice_error: model.text().nullable(),
  e_invoice_created_at: model.dateTime().nullable(),
  e_invoice_cancelled_at: model.dateTime().nullable(),
  e_invoice_cancel_reason: model.text().nullable(),
  provider: model.text().nullable(),
  environment: model.text().nullable(),
  request_reference: model.text().nullable(),

  // Festival Greeting Snapshot
  festival_id: model.text().nullable(),
  festival_name: model.text().nullable(),
  festival_greeting_text: model.text().nullable(),
  festival_template_id: model.text().nullable(),

  items: model.hasMany(() => BillingInvoiceItem, {
    mappedBy: "invoice",
  }),
  customer: model.belongsTo(() => BillingCustomer, {
    mappedBy: "invoices",
  }),
  payments: model.hasMany(() => BillingPayment, {
    mappedBy: "invoice",
  }),
})

// ─── Invoice Item (existing, unchanged) ─────────────────────────────────────

export const BillingInvoiceItem = model.define("billing_invoice_item", {
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

  invoice: model.belongsTo(() => BillingInvoice, {
    mappedBy: "items",
  }),
})

// ─── Payment ────────────────────────────────────────────────────────────────

export const BillingPayment = model.define("billing_payment", {
  id: model.id().primaryKey(),
  amount: model.bigNumber(),
  payment_method: model.text().default("Cash"),
  reference_number: model.text().nullable(),
  payment_date: model.dateTime(),
  recorded_by: model.text().nullable(),
  notes: model.text().nullable(),

  invoice: model.belongsTo(() => BillingInvoice, {
    mappedBy: "payments",
  }),
  customer: model.belongsTo(() => BillingCustomer, {
    mappedBy: "payments",
  }),
})

// ─── Customer Note ──────────────────────────────────────────────────────────

export const BillingCustomerNote = model.define("billing_customer_note", {
  id: model.id().primaryKey(),
  note: model.text(),
  created_by: model.text().nullable(),

  customer: model.belongsTo(() => BillingCustomer, {
    mappedBy: "notes",
  }),
})

// ─── Follow-Up ──────────────────────────────────────────────────────────────

export const BillingFollowUp = model.define("billing_follow_up", {
  id: model.id().primaryKey(),
  follow_up_date: model.dateTime(),
  reason: model.text(),
  assigned_to: model.text().nullable(),
  notes: model.text().nullable(),
  status: model.enum(["PENDING", "COMPLETED", "CANCELLED"]).default("PENDING"),

  customer: model.belongsTo(() => BillingCustomer, {
    mappedBy: "follow_ups",
  }),
})

// ─── Message Log ────────────────────────────────────────────────────────────

export const BillingMessageLog = model.define("billing_message_log", {
  id: model.id().primaryKey(),
  invoice_id: model.text().nullable(),
  channel: model.text().default("whatsapp"),
  message_type: model.text().default("payment_reminder"),
  message_content: model.text(),
  sent_by: model.text().nullable(),
  delivery_status: model.text().default("sent"),
  provider_message_id: model.text().nullable(),

  customer: model.belongsTo(() => BillingCustomer, {
    mappedBy: "message_logs",
  }),
})

// ─── Payment Link ───────────────────────────────────────────────────────────

export const BillingPaymentLink = model.define("billing_payment_link", {
  id: model.id().primaryKey(),
  token: model.text().unique(),
  invoice_id: model.text(),
  customer_id: model.text().nullable(),
  amount: model.bigNumber(),
  status: model.enum(["ACTIVE", "USED", "EXPIRED"]).default("ACTIVE"),
  expires_at: model.dateTime(),
})

// ─── Reminder Settings ──────────────────────────────────────────────────────

export const BillingReminderSettings = model.define("billing_reminder_settings", {
  id: model.id().primaryKey(),
  enabled: model.boolean().default(false),
  preferred_channel: model.text().default("whatsapp"),
  schedule_json: model.text().default('[{"days_before_due":1},{"days_after_due":0},{"days_after_due":1},{"days_after_due":3},{"days_after_due":7}]'),
  max_reminders: model.number().default(5),
  min_interval_hours: model.number().default(24),
  communication_hours_start: model.number().default(9),
  communication_hours_end: model.number().default(20),
  payment_link_expiry_hours: model.number().default(72),
  receipt_message_enabled: model.boolean().default(true),
})

// ─── Message Template ───────────────────────────────────────────────────────

export const BillingMessageTemplate = model.define("billing_message_template", {
  id: model.id().primaryKey(),
  template_type: model.text(),
  channel: model.text().default("whatsapp"),
  subject: model.text().nullable(),
  body_template: model.text(),
  is_active: model.boolean().default(true),
})

// ─── Settings (existing, unchanged) ─────────────────────────────────────────

export const BillingSettings = model.define("billing_settings", {
  id: model.id().primaryKey(),
  business_name: model.text().default("Tirupati Jewellers"),
  legal_name: model.text().default("Tirupati Jewellers"),
  business_address: model.text().nullable(),
  city: model.text().nullable(),
  state: model.text().nullable(),
  pin_code: model.text().nullable(),
  state_code: model.text().default("07"),
  gstin: model.text().nullable(),
  pan: model.text().nullable(),
  phone: model.text().nullable(),
  email: model.text().nullable(),
  website: model.text().nullable(),
  invoice_prefix: model.text().default("TJ/"),
  financial_year: model.text().default("2026-27"),
  terms_conditions: model.text().nullable(),
  authorized_signatory: model.text().nullable(),
  next_invoice_sequence: model.number().default(1),
})
