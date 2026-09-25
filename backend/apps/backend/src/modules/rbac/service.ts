import { MedusaService } from "@medusajs/framework/utils"
import { Role, Permission, UserRole, RolePermission } from "./models/rbac"

export const RBAC_MODULE = "rbac"

type CheckPermissionResult = {
  isAllowed: boolean;
  reason?: string;
};

class RBACModuleService extends MedusaService({
  Role,
  Permission,
  UserRole,
  RolePermission,
}) {
  /**
   * Check if a specific user has a required permission.
   * Super Admins automatically bypass specific permission checks.
   */
  async checkPermission(userId: string, permissionCode: string): Promise<CheckPermissionResult> {
    if (!userId) return { isAllowed: false, reason: "No user ID provided" };
    if (!permissionCode) return { isAllowed: false, reason: "No permission code provided" };

    try {
      // Use the same listUserRoles approach as /admin/my-access (proven to work)
      const userRoles = await this.listUserRoles(
        { user_id: userId },
        { relations: ["role", "role.permissions", "role.permissions.permission"] }
      );

      if (!userRoles || userRoles.length === 0) {
        return { isAllowed: false, reason: "User has no assigned roles" };
      }

      // Super Admin bypasses all granular permission checks
      const isSuperAdmin = userRoles.some((ur: any) => ur.role?.code === "SUPER_ADMIN");
      if (isSuperAdmin) {
        return { isAllowed: true };
      }

      // Check granular permissions across all roles
      for (const ur of userRoles as any[]) {
        if (!ur.role?.permissions) continue;
        const hasPerm = ur.role.permissions.some(
          (rp: any) => rp.permission?.code === permissionCode
        );
        if (hasPerm) return { isAllowed: true };
      }

      return { isAllowed: false, reason: "Insufficient permissions" };
    } catch (err) {
      console.error("RBAC checkPermission failed:", err);
      return { isAllowed: false, reason: "Error fetching permissions" };
    }
  }
}

export default RBACModuleService
