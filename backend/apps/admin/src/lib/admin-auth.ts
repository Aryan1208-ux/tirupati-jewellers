export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("tj_admin_authenticated") === "true";
}

export function getAdminUser(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("tj_admin_user") || "";
}

export function getAdminPermissions(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("tj_admin_permissions") || "[]");
  } catch {
    return [];
  }
}

export function hasAdminPermission(permissionCode: string): boolean {
  if (typeof window === "undefined") return false;
  const perms = getAdminPermissions();
  return perms.includes(permissionCode);
}

export async function logoutAdmin(): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.removeItem("tj_admin_authenticated");
  localStorage.removeItem("tj_admin_user");
  localStorage.removeItem("tj_admin_role");
  localStorage.removeItem("tj_admin_permissions");
  
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.error("Logout API failed", err);
  }
  
  // Optionally force reload
  window.location.href = "/admin/login";
}

export async function loginAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json();
    
    if (data.success) {
      if (typeof window !== "undefined") {
        localStorage.setItem("tj_admin_authenticated", "true");
        localStorage.setItem("tj_admin_user", data.user.email);
        localStorage.setItem("tj_admin_role", JSON.stringify(data.user.role));
        localStorage.setItem("tj_admin_permissions", JSON.stringify(data.user.permissions || []));
      }
      return { success: true };
    }
    
    return { success: false, error: data.error || "Login failed" };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to communicate with server" };
  }
}
