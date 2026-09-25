import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { RBAC_MODULE } from "../modules/rbac/service";

export default async function run({ container }) {
  console.log("Seeding SUPER_ADMIN role for admin@test.com...");
  const rbacModule = container.resolve(RBAC_MODULE);
  const query = container.resolve("query");

  const { data: users } = await query.graph({
    entity: "user",
    fields: ["id", "email"],
    filters: { email: "admin@test.com" }
  });

  if (users.length === 0) {
    console.log("User admin@test.com not found!");
    return;
  }

  const user = users[0];
  const roles = await rbacModule.listRoles({ code: "SUPER_ADMIN" });
  if (roles.length === 0) {
    console.log("SUPER_ADMIN role not found. Did you run the main seed?");
    return;
  }

  const role = roles[0];
  
  const existing = await rbacModule.listUserRoles({ user_id: user.id, role_id: role.id });
  if (existing.length === 0) {
    await rbacModule.createUserRoles({
      user_id: user.id,
      role_id: role.id
    });
    console.log("Successfully assigned SUPER_ADMIN to admin@test.com");
  } else {
    console.log("User already has SUPER_ADMIN role");
  }
}
