import { model } from "@medusajs/framework/utils"
import { BillingCustomer } from "./invoice"

// ─── Greeting Occasion ──────────────────────────────────────────────────────

export const BillingGreetingOccasion = model.define("billing_greeting_occasion", {
  id: model.id().primaryKey(),
  name: model.text(),
  start_date: model.dateTime(),
  end_date: model.dateTime(),
  is_active: model.boolean().default(true),
  greeting_text: model.text().nullable(),
  bill_greeting_text: model.text().nullable(),
  enable_on_bill: model.boolean().default(false),
})

// ─── Greeting Template ──────────────────────────────────────────────────────

export const BillingGreetingTemplate = model.define("billing_greeting_template", {
  id: model.id().primaryKey(),
  name: model.text(),
  occasion_type: model.enum(["BIRTHDAY", "ANNIVERSARY", "FESTIVAL", "CUSTOM"]).default("FESTIVAL"),
  channel: model.enum(["whatsapp", "sms", "email"]).default("whatsapp"),
  language: model.text().default("en"),
  subject: model.text().nullable(),
  message: model.text(),
  is_active: model.boolean().default(true),

  histories: model.hasMany(() => BillingGreetingHistory, {
    mappedBy: "template"
  }),
})

// ─── Greeting History ───────────────────────────────────────────────────────

export const BillingGreetingHistory = model.define("billing_greeting_history", {
  id: model.id().primaryKey(),
  occasion_name: model.text(), // e.g. "Diwali 2026" or "Birthday"
  occasion_id: model.text().nullable(),
  occasion_type: model.enum(["BIRTHDAY", "ANNIVERSARY", "FESTIVAL", "CUSTOM", "POST_PURCHASE"]).default("FESTIVAL"),
  channel: model.text(),
  rendered_message: model.text(),
  status: model.enum(["PENDING", "SCHEDULED", "SENDING", "SENT", "FAILED", "CANCELLED"]).default("SENT"),
  scheduled_at: model.dateTime().nullable(),
  sent_at: model.dateTime().nullable(),
  error_message: model.text().nullable(),
  provider_message_id: model.text().nullable(),
  
  customer: model.belongsTo(() => BillingCustomer, {
    mappedBy: "greetings",
  }),
  template: model.belongsTo(() => BillingGreetingTemplate, {
    mappedBy: "histories",
  }).nullable(),
})

// ─── Greeting Settings ──────────────────────────────────────────────────────

export const BillingGreetingSettings = model.define("billing_greeting_settings", {
  id: model.id().primaryKey(),
  automation_enabled: model.boolean().default(false),
  automatic_birthdays: model.boolean().default(false),
  automatic_anniversaries: model.boolean().default(false),
  automatic_festivals: model.boolean().default(false),
  automatic_post_purchase: model.boolean().default(false),
  post_purchase_delay_days: model.number().default(2),
  test_mode: model.boolean().default(true),
  default_channel: model.enum(["whatsapp", "sms", "email"]).default("whatsapp"),
  preferred_time: model.text().default("09:00"), // HH:MM
})
