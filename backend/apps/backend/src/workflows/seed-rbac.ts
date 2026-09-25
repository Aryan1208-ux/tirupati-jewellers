import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse
} from "@medusajs/framework/workflows-sdk"
import { RBAC_MODULE } from "../modules/rbac/service"

const seedRbacStep = createStep("seed-rbac-step", async (input, { container }) => {
  const rbacModule = container.resolve(RBAC_MODULE) as any

  // 1. Define Permissions
  const permissions = [
    { code: "dashboard.view", name: "View Dashboard", module: "dashboard", action: "view" },
    { code: "products.view", name: "View Products", module: "products", action: "view" },
    { code: "products.create", name: "Create Products", module: "products", action: "create" },
    { code: "products.update", name: "Update Products", module: "products", action: "update" },
    { code: "products.delete", name: "Delete Products", module: "products", action: "delete" },
    { code: "categories.view", name: "View Categories", module: "categories", action: "view" },
    { code: "categories.manage", name: "Manage Categories", module: "categories", action: "manage" },
    { code: "collections.view", name: "View Collections", module: "collections", action: "view" },
    { code: "collections.manage", name: "Manage Collections", module: "collections", action: "manage" },
    { code: "inventory.view", name: "View Inventory", module: "inventory", action: "view" },
    { code: "inventory.manage", name: "Manage Inventory", module: "inventory", action: "manage" },
    { code: "barcode.view", name: "View Barcode", module: "barcode", action: "view" },
    { code: "barcode.manage", name: "Manage Barcode", module: "barcode", action: "manage" },
    { code: "billing.view", name: "View Billing", module: "billing", action: "view" },
    { code: "billing.create", name: "Create Billing", module: "billing", action: "create" },
    { code: "billing.update", name: "Update Billing", module: "billing", action: "update" },
    { code: "billing.delete", name: "Delete Billing", module: "billing", action: "delete" },
    { code: "invoices.view", name: "View Invoices", module: "invoices", action: "view" },
    { code: "invoices.create", name: "Create Invoices", module: "invoices", action: "create" },
    { code: "invoices.download", name: "Download Invoices", module: "invoices", action: "download" },
    { code: "estimates.view", name: "View Estimates", module: "billing", action: "view" },
    { code: "estimates.create", name: "Create Estimates", module: "billing", action: "create" },
    { code: "estimates.update", name: "Update Estimates", module: "billing", action: "update" },
    { code: "estimates.delete", name: "Delete Estimates", module: "billing", action: "delete" },
    { code: "greetings.view", name: "View Greetings", module: "billing", action: "view" },
    { code: "greetings.manage", name: "Manage Greetings", module: "billing", action: "manage" },
    { code: "customers.view", name: "View Customers", module: "customers", action: "view" },
    { code: "customers.update", name: "Update Customers", module: "customers", action: "update" },
    { code: "customers.activity.view", name: "View Customer Activity", module: "customers", action: "view_activity" },
    { code: "payments.view", name: "View Payments", module: "payments", action: "view" },
    { code: "payments.manage", name: "Manage Payments", module: "payments", action: "manage" },
    { code: "payments.refund", name: "Refund Payments", module: "payments", action: "refund" },
    { code: "orders.view", name: "View Orders", module: "orders", action: "view" },
    { code: "orders.manage", name: "Manage Orders", module: "orders", action: "manage" },
    { code: "promotions.view", name: "View Promotions", module: "promotions", action: "view" },
    { code: "promotions.create", name: "Create Promotions", module: "promotions", action: "create" },
    { code: "promotions.update", name: "Update Promotions", module: "promotions", action: "update" },
    { code: "promotions.delete", name: "Delete Promotions", module: "promotions", action: "delete" },
    { code: "gold_rates.view", name: "View Gold Rates", module: "gold_rates", action: "view" },
    { code: "gold_rates.manage", name: "Manage Gold Rates", module: "gold_rates", action: "manage" },
    { code: "reports.view", name: "View Reports", module: "reports", action: "view" },
    { code: "shipping.view", name: "View Shipping", module: "shipping", action: "view" },
    { code: "shipping.manage", name: "Manage Shipping", module: "shipping", action: "manage" },
    { code: "settings.view", name: "View Settings", module: "settings", action: "view" },
    { code: "settings.manage", name: "Manage Settings", module: "settings", action: "manage" },
    { code: "users.view", name: "View Users", module: "users", action: "view" },
    { code: "users.manage", name: "Manage Users", module: "users", action: "manage" },
    { code: "roles.view", name: "View Roles", module: "roles", action: "view" },
    { code: "roles.manage", name: "Manage Roles", module: "roles", action: "manage" },
    { code: "audit_logs.view", name: "View Audit Logs", module: "audit_logs", action: "view" },
  ]

  const createdPermissions: any[] = []
  for (const perm of permissions) {
    const existing = await rbacModule.listPermissions({ code: perm.code })
    if (existing.length === 0) {
      const created = await rbacModule.createPermissions(perm)
      createdPermissions.push(created)
    } else {
      createdPermissions.push(existing[0])
    }
  }

  const getPermIds = (codes: string[]) => {
    return codes
      .map(code => createdPermissions.find(p => p.code === code)?.id)
      .filter(Boolean) as string[]
  }

  // 2. Define Roles and assign permissions
  const roles = [
    {
      code: "SUPER_ADMIN",
      name: "Super Admin",
      description: "Full access to all system functions",
      is_system_role: true,
      permissions: permissions.map(p => p.code),
    },
    {
      code: "MANAGER",
      name: "Manager",
      description: "Store manager with broad access except security settings",
      is_system_role: true,
      permissions: [
        "dashboard.view", "products.view", "products.create", "products.update", "products.delete",
        "categories.view", "categories.manage", "collections.view", "collections.manage",
        "inventory.view", "inventory.manage", "barcode.view", "barcode.manage",
        "billing.view", "billing.create", "billing.update", "billing.delete",
        "invoices.view", "invoices.create", "invoices.download",
        "estimates.view", "estimates.create", "estimates.update", "estimates.delete",
        "greetings.view", "greetings.manage",
        "customers.view", "customers.update", "customers.activity.view", "payments.view", "payments.manage", "payments.refund",
        "orders.view", "orders.manage", "promotions.view", "promotions.create", "promotions.update", "promotions.delete",
        "gold_rates.view", "gold_rates.manage", "reports.view", "shipping.view", "shipping.manage"
      ],
    },
    {
      code: "BILLING_STAFF",
      name: "Billing Staff",
      description: "Can manage billing, invoices, customers, and payments",
      is_system_role: true,
      permissions: [
        "dashboard.view", "billing.view", "billing.create", "billing.update",
        "invoices.view", "invoices.create", "invoices.download",
        "estimates.view", "estimates.create", "estimates.update", "estimates.delete",
        "greetings.view", "greetings.manage",
        "customers.view", "customers.update", "payments.view", "payments.manage",
        "orders.view", "barcode.view"
      ],
    },
    {
      code: "INVENTORY_STAFF",
      name: "Inventory Staff",
      description: "Can manage products, categories, collections, inventory, and barcodes",
      is_system_role: true,
      permissions: [
        "dashboard.view", "products.view", "products.create", "products.update",
        "categories.view", "collections.view", "inventory.view", "inventory.manage",
        "barcode.view", "barcode.manage"
      ],
    },
    {
      code: "MARKETING_STAFF",
      name: "Marketing Staff",
      description: "Can manage promotions, offers, and view catalogs",
      is_system_role: true,
      permissions: [
        "dashboard.view", "products.view", "categories.view", "collections.view",
        "promotions.view", "promotions.create", "promotions.update", "promotions.delete"
      ],
    },
  ]

  for (const roleDef of roles) {
    let role;
    const existingRole = await rbacModule.listRoles({ code: roleDef.code }, { relations: ["permissions"] })
    
    if (existingRole.length === 0) {
      role = await rbacModule.createRoles({
        code: roleDef.code,
        name: roleDef.name,
        description: roleDef.description,
        is_system_role: roleDef.is_system_role
      })
    } else {
      role = existingRole[0]
      // Optionally clean up old role permissions here if we wanted to enforce strictly
    }

    // Assign permissions
    const permIds = getPermIds(roleDef.permissions)
    
    // Check existing role permissions
    const existingRolePerms = await rbacModule.listRolePermissions({ role_id: role.id })
    const existingPermIds = existingRolePerms.map(rp => rp.permission_id)

    // Add missing permissions
    for (const pId of permIds) {
      if (!existingPermIds.includes(pId)) {
        await rbacModule.createRolePermissions({
          role_id: role.id,
          permission_id: pId
        })
      }
    }
  }

  // 3. Assign Super Admin to the first Medusa User (Bootstrap)
  // Safely find the first user (assuming the owner) and grant them SUPER_ADMIN
  const query = container.resolve("query")
  const { data: users } = await query.graph({
    entity: "user",
    fields: ["id", "email"],
  })
  
  if (users.length > 0) {
    const firstUser = users[0]
    const superAdminRoles = await rbacModule.listRoles({ code: "SUPER_ADMIN" })
    
    if (superAdminRoles.length > 0) {
      const saRole = superAdminRoles[0]
      const existingAssignment = await rbacModule.listUserRoles({ user_id: firstUser.id })
      
      if (existingAssignment.length === 0) {
        await rbacModule.createUserRoles({
          user_id: firstUser.id,
          role_id: saRole.id,
        })
      }
    }
  }

  return new StepResponse({ success: true })
})

export const seedRbacWorkflow = createWorkflow(
  "seed-rbac-workflow",
  () => {
    return new WorkflowResponse(seedRbacStep())
  }
)
