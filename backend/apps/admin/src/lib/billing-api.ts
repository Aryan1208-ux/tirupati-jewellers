const MEDUSA_URL = "/api/medusa";

/**
 * Authenticated fetch wrapper for admin billing API calls.
 * Next.js Middleware automatically attaches the admin HttpOnly JWT token.
 */
export async function billingFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Ensure Content-Type for POST/PUT/PATCH
  if (options.method && ["POST", "PUT", "PATCH"].includes(options.method.toUpperCase())) {
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const url = path.startsWith("http") ? path : `${MEDUSA_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    // If we get a 401 Unauthorized, the session has expired or is invalid.
    // Clear local storage auth flags and redirect to login.
    localStorage.removeItem("tj_admin_authenticated");
    localStorage.removeItem("tj_admin_user");
    localStorage.removeItem("tj_admin_role");
    localStorage.removeItem("tj_admin_permissions");
    window.location.href = "/admin/login";
  }

  return response;
}

/**
 * Get the billing API base URL.
 */
export function getBillingUrl(): string {
  return MEDUSA_URL;
}
