import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { RBAC_MODULE } from "../modules/rbac/service"

export function requirePermission(permissionCode: string) {
  return async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    // Determine user ID from Medusa auth context
    const userId = (req as any).auth_context?.actor_id

    if (!userId) {
      return res.status(401).json({
        type: "unauthorized",
        message: "You must be logged in to access this resource."
      })
    }

    try {
      const rbacModule = req.scope.resolve(RBAC_MODULE) as any
      const { isAllowed, reason } = await rbacModule.checkPermission(userId, permissionCode)

      if (!isAllowed) {
        return res.status(403).json({
          type: "forbidden",
          message: "You do not have permission to perform this action.",
          reason
        })
      }

      return next()
    } catch (err) {
      console.error("RBAC check failed:", err)
      return res.status(500).json({
        type: "server_error",
        message: "Failed to verify permissions."
      })
    }
  }
}
