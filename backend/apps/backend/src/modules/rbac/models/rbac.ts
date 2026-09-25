import { model } from "@medusajs/framework/utils"

export const Role = model.define("rbac_role", {
  id: model.id().primaryKey(),
  name: model.text(),
  code: model.text().unique(), // e.g. SUPER_ADMIN, MANAGER
  description: model.text().nullable(),
  is_system_role: model.boolean().default(false),
  
  permissions: model.hasMany(() => RolePermission, {
    mappedBy: "role",
  }),
  user_roles: model.hasMany(() => UserRole, {
    mappedBy: "role",
  }),
})

export const Permission = model.define("rbac_permission", {
  id: model.id().primaryKey(),
  code: model.text().unique(), // e.g. billing.create
  name: model.text(),
  description: model.text().nullable(),
  module: model.text().nullable(), // e.g. billing, products
  action: model.text().nullable(), // e.g. create, update
  
  roles: model.hasMany(() => RolePermission, {
    mappedBy: "permission",
  }),
})

export const UserRole = model.define("rbac_user_role", {
  id: model.id().primaryKey(),
  user_id: model.text(), // Map to Medusa User ID manually
  
  role: model.belongsTo(() => Role, {
    mappedBy: "user_roles",
  }),
})

export const RolePermission = model.define("rbac_role_permission", {
  id: model.id().primaryKey(),
  
  role: model.belongsTo(() => Role, {
    mappedBy: "permissions",
  }),
  permission: model.belongsTo(() => Permission, {
    mappedBy: "roles",
  }),
})
