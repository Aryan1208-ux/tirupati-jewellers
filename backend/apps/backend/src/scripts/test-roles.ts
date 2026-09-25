import { ExecArgs } from "@medusajs/framework/types"
import { RBAC_MODULE } from "../modules/rbac/service"

export default async function testRoles({ container }: ExecArgs) {
  const rbacModule = container.resolve(RBAC_MODULE) as any
  const query = container.resolve("query")
  
  const { data: users } = await query.graph({
    entity: "user",
    fields: ["id", "email"],
  })
  
  const targetUser = users.find(u => u.email.toLowerCase() === "tjewellers13@gmail.com")
  if (targetUser) {
    const superAdminRoles = await rbacModule.listRoles({ code: "SUPER_ADMIN" })
    if (superAdminRoles.length > 0) {
        await rbacModule.createUserRoles({
            user_id: targetUser.id,
            role_id: superAdminRoles[0].id
        })
        console.log("Assigned SUPER_ADMIN to Tjewellers13@gmail.com")
    }
  }
}
