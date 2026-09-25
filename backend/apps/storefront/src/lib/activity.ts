export type ActivityEventType = 
  | "PAGE_VIEW"
  | "PRODUCT_VIEW"
  | "CATEGORY_VIEW"
  | "SEARCH"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "CHECKOUT_STARTED"
  | "ORDER_PLACED";

interface ActivityPayload {
  event_type: ActivityEventType;
  product_id?: string;
  variant_id?: string;
  category_id?: string;
  search_query?: string;
  page_path?: string;
  metadata?: any;
}

/**
 * Fire-and-forget activity tracker.
 * Does not block rendering or user flows.
 */
export async function trackActivity(payload: ActivityPayload) {
  try {
    // Add current path if not provided
    if (!payload.page_path && typeof window !== "undefined") {
      payload.page_path = window.location.pathname + window.location.search;
    }

    const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
    
    // We use a regular fetch, which will include credentials (cookies) to automatically
    // track the customer's authenticated session, and to allow the server to read/set the anonymous ID cookie.
    fetch(`${MEDUSA_URL}/store/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      body: JSON.stringify(payload),
      keepalive: true, // ensures the request is sent even if the user navigates away
      credentials: "include",
      // Note: Medusa v2 requires `credentials: 'include'` for auth tokens usually, but cross-origin cookies need CORS setup.
      // If CORS isn't fully set up for cookies, we'll rely on the Authorization header for auth, but we don't have it here.
      // Wait, let's use credentials: 'include' so the `tj_visitor_id` cookie can be passed/set.
    }).catch(err => {
      // Ignore network errors silently to avoid console spam for users
    });
  } catch (err) {
    // Fail silently, analytics should never break the site
  }
}
