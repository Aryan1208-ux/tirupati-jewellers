import { MedusaService } from "@medusajs/framework/utils"
import {
  BillingCustomer,
  BillingInvoice,
  BillingInvoiceItem,
  BillingPayment,
  BillingCustomerNote,
  BillingFollowUp,
  BillingMessageLog,
  BillingPaymentLink,
  BillingReminderSettings,
  BillingMessageTemplate,
  BillingSettings,
} from "./models/invoice"
import { BillingEstimate, BillingEstimateItem } from "./models/estimate"
import {
  BillingGreetingOccasion,
  BillingGreetingTemplate,
  BillingGreetingHistory,
  BillingGreetingSettings,
} from "./models/greetings"

class BillingModuleService extends MedusaService({
  BillingCustomer,
  BillingInvoice,
  BillingInvoiceItem,
  BillingPayment,
  BillingCustomerNote,
  BillingFollowUp,
  BillingMessageLog,
  BillingPaymentLink,
  BillingReminderSettings,
  BillingMessageTemplate,
  BillingSettings,
  BillingEstimate,
  BillingEstimateItem,
  BillingGreetingOccasion,
  BillingGreetingTemplate,
  BillingGreetingHistory,
  BillingGreetingSettings,
}) {
  // MedusaService provides standard CRUD for all registered models.
}

export default BillingModuleService
