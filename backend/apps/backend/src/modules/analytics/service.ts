import { MedusaService } from "@medusajs/framework/utils"
import { CustomerActivity } from "./models/customer-activity"

export class AnalyticsModuleService extends MedusaService({
  CustomerActivity,
}) {}
