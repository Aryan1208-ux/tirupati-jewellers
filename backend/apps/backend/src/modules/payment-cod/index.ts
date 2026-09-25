import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import CodProviderService from "./service"

const services = [CodProviderService]

export default ModuleProvider(Modules.PAYMENT, {
  services,
})
