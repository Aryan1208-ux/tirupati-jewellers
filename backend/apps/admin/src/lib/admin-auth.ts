/**
 * Shared auth utilities for the Tirupati Jewellers admin panel.
 * All admin billing pages import from this file.
 */

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("tj_admin_authenticated") === "true"
}

export function getAdminUser(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("tj_admin_user") || ""
}
