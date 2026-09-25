import { config } from "dotenv"
config()
import { initialize as initializeAuth } from "@medusajs/auth"
import { initialize as initializeUser } from "@medusajs/user"
import { RBAC_MODULE } from "./src/modules/rbac/service"
import { initialize as initModules } from "@medusajs/modules-sdk"
import { Modules } from "@medusajs/framework/utils"
// I will just use raw SQL to insert the user role for simplicity because loading all Medusa modules in a one-off script is complex in v2.
