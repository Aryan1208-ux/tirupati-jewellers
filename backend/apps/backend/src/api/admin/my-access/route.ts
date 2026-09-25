import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RBAC_MODULE } from "../../../modules/rbac/service"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const userId = (req as any).auth_context?.actor_id

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const rbacModule = req.scope.resolve(RBAC_MODULE) as any

    // Fetch user's roles and permissions
    const userRoles = await rbacModule.listUserRoles({
      user_id: userId,
    }, {
      relations: ["role", "role.permissions", "role.permissions.permission"]
    })

    if (!userRoles || userRoles.length === 0) {
      return res.json({ role: null, permissions: [] })
    }

    const primaryRole = userRoles[0].role
    const isSuperAdmin = primaryRole.code === "SUPER_ADMIN"
    
    // Flatten permissions
    let permissions: string[] = []
    
    if (isSuperAdmin) {
      // Super Admin gets all configured permissions
      const allPerms = await rbacModule.listPermissions({})
      permissions = allPerms.map((p: any) => p.code)
    } else {
      for (const ur of userRoles) {
        if (ur.role && ur.role.permissions) {
          for (const rp of ur.role.permissions) {
            if (rp.permission?.code && !permissions.includes(rp.permission.code)) {
              permissions.push(rp.permission.code)
            }
          }
        }
      }
    }

    res.json({
      role: {
        code: primaryRole.code,
        name: primaryRole.name,
        is_system_role: primaryRole.is_system_role
      },
      permissions
    })
  } catch (error: any) {
    console.error("Failed to fetch user access:", error)
    res.status(500).json({ error: "Failed to fetch user access" })
  }
}
