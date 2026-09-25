import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RBAC_MODULE } from "../../../../modules/rbac/service"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const rbacModule = req.scope.resolve(RBAC_MODULE) as any

    // Fetch all Medusa admin users
    const { data: users } = await query.graph({
      entity: "user",
      fields: ["id", "email", "first_name", "last_name", "created_at"],
    })

    // Fetch user roles
    const userRoles = await rbacModule.listUserRoles({}, {
      relations: ["role"]
    })

    const result = users.map((user: any) => {
      const ur = userRoles.find((r: any) => r.user_id === user.id)
      return {
        ...user,
        role: ur ? ur.role : null,
      }
    })

    res.json({ users: result })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const rbacModule = req.scope.resolve(RBAC_MODULE) as any
    const { user_id, role_code } = req.body as any

    if (!user_id || !role_code) {
      return res.status(400).json({ error: "user_id and role_code required" })
    }

    const roles = await rbacModule.listRoles({ code: role_code })
    if (roles.length === 0) {
      return res.status(404).json({ error: "Role not found" })
    }
    const role = roles[0]

    // Remove existing role assignment if any
    const existing = await rbacModule.listUserRoles({ user_id })
    if (existing.length > 0) {
      await rbacModule.deleteUserRoles(existing.map((e: any) => e.id))
    }

    // Create new assignment
    const assigned = await rbacModule.createUserRoles({
      user_id,
      role_id: role.id
    })

    res.json({ success: true, assigned })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
