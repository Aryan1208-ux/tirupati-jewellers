import { defineMiddlewares } from "@medusajs/framework/http";
import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http";
import { requirePermission } from "./rbac-middleware";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

async function enforceSingleManualCoupon(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (req.method === "POST" && req.body && typeof req.body === "object" && "promo_codes" in req.body) {
    const promoCodes = req.body.promo_codes;
    
    // 1. Block multiple codes in the same request payload
    if (Array.isArray(promoCodes) && promoCodes.length > 1) {
      return res.status(400).json({
        type: "invalid_request_error",
        message: "Only one manual voucher can be applied per order.",
      });
    }

    // 2. If it's the `addPromotions` endpoint, we must also check if the cart already has a manual coupon
    // because addPromotions appends rather than replaces.
    if (req.path.includes("/promotions") && Array.isArray(promoCodes) && promoCodes.length === 1) {
      const cartId = req.params.id;
      if (cartId) {
        try {
          const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
          const { data: carts } = await query.graph({
            entity: "cart",
            fields: ["promotions.id", "promotions.is_automatic", "promotions.code"],
            filters: { id: cartId },
          });

          const cart = carts[0];
          if (cart && Array.isArray(cart.promotions)) {
            const existingManual = cart.promotions.filter(
              (p: any) => p.is_automatic === false && !promoCodes.includes(p.code)
            );
            
            if (existingManual.length >= 1) {
              return res.status(400).json({
                type: "invalid_request_error",
                message: "Only one manual voucher can be applied per order. Please remove the existing voucher first or replace it directly.",
              });
            }
          }
        } catch (error) {
          console.error("Error in enforceSingleManualCoupon middleware:", error);
        }
      }
    }
  }
  return next();
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/carts/:id/promotions",
      middlewares: [enforceSingleManualCoupon],
    },
    {
      matcher: "/store/carts/:id",
      middlewares: [enforceSingleManualCoupon],
    },
    
    // --- RBAC Custom Route Protection ---
    // Protect custom routes only, to avoid breaking Native Medusa Admin routes.

    // Billing Center
    {
      matcher: "/admin/billing/dashboard",
      method: "GET",
      middlewares: [requirePermission("dashboard.view")],
    },
    {
      matcher: "/admin/billing/invoices",
      method: "GET",
      middlewares: [requirePermission("invoices.view")],
    },
    {
      matcher: "/admin/billing/invoices",
      method: "POST",
      middlewares: [requirePermission("invoices.create")],
    },
    {
      matcher: "/admin/billing/pending",
      method: "GET",
      middlewares: [requirePermission("invoices.view")],
    },
    {
      matcher: "/admin/billing/customers",
      method: "GET",
      middlewares: [requirePermission("customers.view")],
    },
    {
      matcher: "/admin/billing/payments",
      method: "POST",
      middlewares: [requirePermission("payments.manage")],
    },
    {
      matcher: "/admin/billing/settings",
      method: "GET",
      middlewares: [requirePermission("settings.view")],
    },
    {
      matcher: "/admin/billing/settings",
      method: "POST",
      middlewares: [requirePermission("settings.manage")],
    },
    
    // Estimates
    {
      matcher: "/admin/billing/estimates",
      method: "GET",
      middlewares: [requirePermission("estimates.view")],
    },
    {
      matcher: "/admin/billing/estimates",
      method: "POST",
      middlewares: [requirePermission("estimates.create")],
    },
    {
      matcher: "/admin/billing/estimates/:id",
      method: "GET",
      middlewares: [requirePermission("estimates.view")],
    },
    {
      matcher: "/admin/billing/estimates/:id",
      method: "PUT",
      middlewares: [requirePermission("estimates.update")],
    },
    {
      matcher: "/admin/billing/estimates/:id",
      method: "DELETE",
      middlewares: [requirePermission("estimates.delete")],
    },
    {
      matcher: "/admin/billing/estimates/:id/convert",
      method: "POST",
      middlewares: [requirePermission("invoices.create")],
    },
    
    // Greetings
    {
      matcher: "/admin/billing/greetings*",
      method: "GET",
      middlewares: [requirePermission("greetings.view")],
    },
    {
      matcher: "/admin/billing/greetings*",
      method: ["POST", "PUT", "DELETE"],
      middlewares: [requirePermission("greetings.manage")],
    },
    {
      matcher: "/admin/billing/customers/:id/greetings",
      method: "GET",
      middlewares: [requirePermission("customers.view")],
    },

    
    // Barcodes
    {
      matcher: "/admin/barcodes",
      method: "GET",
      middlewares: [requirePermission("barcode.view")],
    },
    {
      matcher: "/admin/barcodes",
      method: "POST",
      middlewares: [requirePermission("barcode.manage")],
    },
    
    // RBAC Management
    {
      matcher: "/admin/rbac/users",
      method: "GET",
      middlewares: [requirePermission("users.view")],
    },
    {
      matcher: "/admin/rbac/users",
      method: "POST",
      middlewares: [requirePermission("users.manage")],
    },
    {
      matcher: "/admin/rbac/roles",
      method: "GET",
      middlewares: [requirePermission("roles.view")],
    },
    
    // Metal Rates
    {
      matcher: "/admin/rates*",
      method: "GET",
      middlewares: [requirePermission("gold_rates.view")],
    },
    {
      matcher: "/admin/rates*",
      method: "POST",
      middlewares: [requirePermission("gold_rates.manage")],
    },

    // --- NATIVE MEDUSA ADMIN ROUTE PROTECTION ---
    // These ensure that users accessing Native endpoints via BFF or direct Admin UI
    // are subjected to the business RBAC rules.

    // Products
    { matcher: "/admin/products", method: "GET", middlewares: [requirePermission("products.view")] },
    { matcher: "/admin/products/:id", method: "GET", middlewares: [requirePermission("products.view")] },
    { matcher: "/admin/products", method: "POST", middlewares: [requirePermission("products.create")] },
    { matcher: "/admin/products/:id", method: "POST", middlewares: [requirePermission("products.update")] },
    { matcher: "/admin/products/:id", method: "DELETE", middlewares: [requirePermission("products.delete")] },

    // Categories & Collections
    { matcher: "/admin/product-categories*", method: "GET", middlewares: [requirePermission("categories.view")] },
    { matcher: "/admin/product-categories*", method: "POST", middlewares: [requirePermission("categories.manage")] },
    { matcher: "/admin/product-categories*", method: "DELETE", middlewares: [requirePermission("categories.manage")] },
    { matcher: "/admin/collections*", method: "GET", middlewares: [requirePermission("collections.view")] },
    { matcher: "/admin/collections*", method: "POST", middlewares: [requirePermission("collections.manage")] },
    { matcher: "/admin/collections*", method: "DELETE", middlewares: [requirePermission("collections.manage")] },

    // Inventory
    { matcher: "/admin/inventory-items*", method: "GET", middlewares: [requirePermission("inventory.view")] },
    { matcher: "/admin/inventory-items*", method: "POST", middlewares: [requirePermission("inventory.manage")] },
    { matcher: "/admin/inventory-items*", method: "DELETE", middlewares: [requirePermission("inventory.manage")] },

    // Orders
    { matcher: "/admin/orders*", method: "GET", middlewares: [requirePermission("orders.view")] },
    { matcher: "/admin/orders*", method: "POST", middlewares: [requirePermission("orders.manage")] },

    // Customers
    { matcher: "/admin/customers*", method: "GET", middlewares: [requirePermission("customers.view")] },
    { matcher: "/admin/customers*", method: "POST", middlewares: [requirePermission("customers.update")] },
    { matcher: "/admin/customers/:id/activity", method: "GET", middlewares: [requirePermission("customers.activity.view")] },

    // Promotions
    { matcher: "/admin/promotions*", method: "GET", middlewares: [requirePermission("promotions.view")] },
    { matcher: "/admin/promotions", method: "POST", middlewares: [requirePermission("promotions.create")] },
    { matcher: "/admin/promotions/:id", method: "POST", middlewares: [requirePermission("promotions.update")] },
    { matcher: "/admin/promotions/:id", method: "DELETE", middlewares: [requirePermission("promotions.delete")] },

    // Users
    { matcher: "/admin/users*", method: "GET", middlewares: [requirePermission("users.view")] },
    { matcher: "/admin/users*", method: "POST", middlewares: [requirePermission("users.manage")] },
    { matcher: "/admin/users*", method: "DELETE", middlewares: [requirePermission("users.manage")] },

    // Settings
    { matcher: "/admin/store*", method: ["GET", "POST"], middlewares: [requirePermission("settings.manage")] },
    { matcher: "/admin/regions*", method: ["GET", "POST", "DELETE"], middlewares: [requirePermission("settings.manage")] },
    { matcher: "/admin/taxes*", method: ["GET", "POST", "DELETE"], middlewares: [requirePermission("settings.manage")] },
    { matcher: "/admin/sales-channels*", method: ["GET", "POST", "DELETE"], middlewares: [requirePermission("settings.manage")] },
  ],
});
