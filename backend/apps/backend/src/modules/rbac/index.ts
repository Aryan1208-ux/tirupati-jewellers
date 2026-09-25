import { Module } from "@medusajs/framework/utils"
import RBACModuleService, { RBAC_MODULE } from "./service"

export default Module(RBAC_MODULE, {
  service: RBACModuleService,
})
