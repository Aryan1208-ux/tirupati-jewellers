import { MedusaContainer } from "@medusajs/framework/types"
import { BILLING_MODULE } from "../modules/billing"
import BillingModuleService from "../modules/billing/service"
import { sendMessage } from "../lib/messaging"
import { renderGreetingTemplate } from "../modules/billing/utils/greetings"

export default async function greetingSchedulerJob(
  container: MedusaContainer
) {
  const billingModule = container.resolve<BillingModuleService>(BILLING_MODULE)
  
  try {
    let settings = await billingModule.listBillingGreetingSettings()
    if (settings.length === 0) {
      settings = [await billingModule.createBillingGreetingSettings({})]
    }
    const config = settings[0]

    // 0. Automation Check
    if (!config.automation_enabled) {
      console.log("[GreetingScheduler] Automation is disabled. Exiting.")
      return
    }

    // Fetch active occasions for today
    const today = new Date()
    today.setHours(0,0,0,0)
    
    const allOccasions = await billingModule.listBillingGreetingOccasions({ is_active: true })
    const activeOccasions = allOccasions.filter(occ => {
      const start = new Date(occ.start_date)
      const end = new Date(occ.end_date)
      start.setHours(0,0,0,0)
      end.setHours(23,59,59,999)
      return today.getTime() >= start.getTime() && today.getTime() <= end.getTime()
    })

    const templates = await billingModule.listBillingGreetingTemplates({ is_active: true })
    
    if (templates.length === 0) return

    const customers = await billingModule.listBillingCustomers({ greeting_opt_in: true })
    
    const currentYear = today.getFullYear()

    for (const customer of customers) {
      const sentHistory: any[] = await billingModule.listBillingGreetingHistories({ customer_id: customer.id })
      
      const hasBeenSent = (occasionType: string, occasionId?: string) => sentHistory.some(h => {
        if (!h.sent_at && h.status !== 'SCHEDULED') return false
        const sentDate = h.sent_at ? new Date(h.sent_at) : new Date(h.scheduled_at || h.created_at)
        const isSameYear = sentDate.getFullYear() === currentYear
        if (!isSameYear) return false
        
        if (occasionType === "FESTIVAL") {
          return h.occasion_type === "FESTIVAL" && h.occasion_id === occasionId
        }
        return h.occasion_type === occasionType
      })

      // 1. Process Festivals
      if (config.automatic_festivals) {
        for (const occ of activeOccasions) {
          if (hasBeenSent("FESTIVAL", occ.id)) continue
          
          const template = templates.find(t => t.occasion_type === "FESTIVAL")
          if (template) {
            await sendAutomatedGreeting(billingModule, customer, template, occ.name, config.test_mode, "FESTIVAL", occ.id)
          }
        }
      }

      // 2. Process Birthdays
      if (config.automatic_birthdays && customer.date_of_birth) {
        const dob = new Date(customer.date_of_birth)
        if (dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth()) {
          if (!hasBeenSent("BIRTHDAY")) {
            const template = templates.find(t => t.occasion_type === "BIRTHDAY")
            if (template) {
              await sendAutomatedGreeting(billingModule, customer, template, "Birthday", config.test_mode, "BIRTHDAY")
            }
          }
        }
      }

      // 3. Process Anniversaries
      if (config.automatic_anniversaries && customer.anniversary_date) {
        const anniv = new Date(customer.anniversary_date)
        if (anniv.getDate() === today.getDate() && anniv.getMonth() === today.getMonth()) {
          if (!hasBeenSent("ANNIVERSARY")) {
            const template = templates.find(t => t.occasion_type === "ANNIVERSARY")
            if (template) {
              await sendAutomatedGreeting(billingModule, customer, template, "Anniversary", config.test_mode, "ANNIVERSARY")
            }
          }
        }
      }
      
      // 4. Process Post-Purchase
      if (config.automatic_post_purchase) {
        const targetDate = new Date(today)
        targetDate.setDate(targetDate.getDate() - config.post_purchase_delay_days)
        
        // Find if customer has any invoice matching targetDate
        const invoices: any[] = await billingModule.listBillingInvoices({ customer_id: customer.id, payment_status: "PAID" })
        for (const inv of invoices) {
          const invDate = new Date(inv.created_at)
          invDate.setHours(0,0,0,0)
          
          if (invDate.getTime() === targetDate.getTime()) {
            // Found a paid invoice exactly 'delay' days ago. Check if post-purchase greeting already sent for this invoice year/id (for simplicity, just check this year for this occasion type)
            if (!hasBeenSent("POST_PURCHASE", inv.id)) {
              const template = templates.find(t => t.occasion_type === "POST_PURCHASE" as any)
              if (template) {
                await sendAutomatedGreeting(billingModule, customer, template, "Thank You", config.test_mode, "POST_PURCHASE", inv.id)
              }
            }
          }
        }
      }
    }

  } catch (error) {
    console.error("[GreetingScheduler] Error running job:", error)
  }
}

async function sendAutomatedGreeting(billingModule: BillingModuleService, customer: any, template: any, occasionName: string, testMode: boolean, occasionType: "BIRTHDAY" | "ANNIVERSARY" | "FESTIVAL" | "CUSTOM" | "POST_PURCHASE", occasionId?: string) {
  const channel = template.channel
  if (!customer.mobile && channel !== "email") return
  if (channel === "whatsapp" && !customer.whatsapp_opt_in) return
  if (channel === "sms" && !customer.sms_opt_in) return
  if (channel === "email" && !customer.email_opt_in) return

  const context = {
    customer_name: customer.name || "Valued Customer",
    occasion_name: occasionName,
  }
  const rendered = renderGreetingTemplate(template.message, context)

  const result = await sendMessage({
    to: channel === "email" ? (customer.email || "") : (customer.mobile || ""),
    channel: channel as any,
    content: rendered,
    isSimulated: testMode
  })

  await billingModule.createBillingGreetingHistories({
    occasion_name: occasionName,
    occasion_id: occasionId,
    occasion_type: occasionType,
    channel,
    rendered_message: rendered,
    status: result.success ? "SENT" : "FAILED",
    error_message: result.error || null,
    sent_at: result.success ? new Date() : undefined,
    customer_id: customer.id,
    template_id: template.id,
  })
}

// Medusa Job config: run every day at 9 AM
export const config = {
  name: "send-greetings",
  schedule: "0 9 * * *", 
}
