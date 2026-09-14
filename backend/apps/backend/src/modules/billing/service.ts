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
}) {
  // MedusaService provides standard CRUD for all registered models.
}

export default BillingModuleService
