import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RBAC_MODULE } from "../../../../modules/rbac/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const rbacModule = req.scope.resolve(RBAC_MODULE) as any
    const roles = await rbacModule.listRoles({}, {
      relations: ["permissions", "permissions.permission"]
    })
    res.json({ roles })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
