import { MedusaContainer } from "@medusajs/framework/types"
import { BILLING_MODULE } from "../modules/billing"
import BillingModuleService from "../modules/billing/service"
import { sendMessage } from "../lib/messaging"
import crypto from "crypto"

// Run every hour to check for pending payments that need reminders
export default async function paymentRemindersJob(
  container: MedusaContainer
) {
  const billingModule = container.resolve<BillingModuleService>(BILLING_MODULE)
  
  try {
    // 1. Fetch settings
    const [settings] = await billingModule.listBillingReminderSettings()
    if (!settings || !settings.enabled) {
      console.log("[PaymentReminders] Automated reminders are disabled.")
      return
    }

    // 2. Check communication hours
    const currentHour = new Date().getHours()
    if (currentHour < settings.communication_hours_start || currentHour >= settings.communication_hours_end) {
      console.log(`[PaymentReminders] Outside communication hours (${settings.communication_hours_start}-${settings.communication_hours_end}). Skipping.`)
      return
    }

    // 3. Find eligible invoices (PENDING or PARTIALLY_PAID, reminder_enabled = true)
    const invoices = await billingModule.listBillingInvoices(
      { reminder_enabled: true },
      { relations: ["customer"] }
    )
    
    const pendingInvoices = invoices.filter(inv => 
      (inv.payment_status === "PENDING" || inv.payment_status === "PARTIALLY_PAID") &&
      inv.customer?.mobile
    )

    console.log(`[PaymentReminders] Found ${pendingInvoices.length} pending invoices with reminders enabled.`)

    for (const invoice of pendingInvoices) {
      // 4. Check if max reminders reached
      const previousMessages = await billingModule.listBillingMessageLogs({
        invoice_id: invoice.id,
        message_type: "payment_reminder",
      })

      if (previousMessages.length >= settings.max_reminders) {
        continue // Reached limit
      }

      // 5. Check minimum interval
      if (previousMessages.length > 0) {
        const lastMessage = previousMessages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        
        const hoursSinceLast = (Date.now() - new Date(lastMessage.created_at).getTime()) / (1000 * 60 * 60)
        if (hoursSinceLast < settings.min_interval_hours) {
          continue // Too soon to send another
        }
      }

      // 6. Generate Payment Link token
      const outstanding = Number(invoice.grand_total) - Number(invoice.amount_paid || 0)
      
      // Invalidate old active links for this invoice
      const oldLinks = await billingModule.listBillingPaymentLinks({
        invoice_id: invoice.id,
        status: "ACTIVE"
      })
      for (const link of oldLinks) {
        await billingModule.updateBillingPaymentLinks({ id: link.id, status: "EXPIRED" })
      }

      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + settings.payment_link_expiry_hours * 60 * 60 * 1000)
      
      await billingModule.createBillingPaymentLinks({
        token,
        invoice_id: invoice.id,
        customer_id: invoice.customer?.id || null,
        amount: outstanding,
        status: "ACTIVE",
        expires_at: expiresAt
      })

      // Construct payment URL
      const baseUrl = process.env.STOREFRONT_URL || "http://localhost:3000"
      const paymentUrl = `${baseUrl}/pay/${token}`

      // 7. Send Message
      const messageContent = `Dear ${invoice.customer?.name},\n\nThis is a payment reminder for Invoice ${invoice.invoice_number}.\n\nOutstanding Amount: ₹${outstanding.toLocaleString("en-IN")}\n\nYou can pay securely online via this link: ${paymentUrl}\n\nThank you,\nTirupati Jewellers`

      const result = await sendMessage({
        to: invoice.customer?.mobile as string,
        channel: settings.preferred_channel as any,
        content: messageContent,
        isSimulated: true // Currently running in sim mode
      })

      // 8. Log Message
      await billingModule.createBillingMessageLogs({
        customer_id: invoice.customer?.id as string,
        invoice_id: invoice.id,
        channel: settings.preferred_channel,
        message_type: "payment_reminder",
        message_content: messageContent,
        sent_by: "System Cron",
        delivery_status: result.success ? "sent" : "failed",
        provider_message_id: result.messageId || null,
      })

      console.log(`[PaymentReminders] Sent reminder for invoice ${invoice.invoice_number} to ${invoice.customer?.name}`)
    }

  } catch (error) {
    console.error("[PaymentReminders] Error running job:", error)
  }
}

// Medusa Job config: run every hour
export const config = {
  name: "send-payment-reminders",
  schedule: "0 * * * *", 
}
