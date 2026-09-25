import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const cartId = (req.query.cart_id as string) || null;

  try {
    const { data: promotions } = await query.graph({
      entity: "promotion",
      fields: [
        "id",
        "code",
        "type",
        "status",
        "is_automatic",
        "metadata",
        "campaign.*",
        "application_method.*",
        "application_method.buy_rules.*",
        "application_method.buy_rules.values.*",
        "rules.*",
        "rules.values.*",
      ],
    });

    let cart: any = null;
    if (cartId) {
      try {
        const { data: carts } = await query.graph({
          entity: "cart",
          fields: [
            "id",
            "currency_code",
            "subtotal",
            "sales_channel_id",
            "region_id",
            "promotions.id",
            "promotions.code",
          ],
          filters: { id: cartId },
        });
        cart = carts[0] || null;
      } catch (e) {
        console.warn("Could not retrieve cart for offers evaluation:", e);
      }
    }

    const now = new Date();
    const activeOffers: any[] = [];

    for (const p of promotions as any[]) {
      // Must not be automatic
      if (p.is_automatic) continue;

      // Status must be active (or undefined in older setups)
      if (p.status && p.status !== "active") continue;

      // Must have display_on_website !== false
      if (p.metadata?.display_on_website === false) continue;

      // Check campaign date validity
      if (p.campaign) {
        const start = p.campaign.starts_at ? new Date(p.campaign.starts_at) : null;
        const end = p.campaign.ends_at ? new Date(p.campaign.ends_at) : null;
        if (start && start > now) continue;
        if (end && end < now) continue;
      }

      // Check currency if specified on application_method
      if (cart && p.application_method?.currency_code) {
        if (
          cart.currency_code &&
          p.application_method.currency_code.toLowerCase() !== cart.currency_code.toLowerCase()
        ) {
          continue;
        }
      }

      // Check sales channel rule if present
      if (cart && cart.sales_channel_id && Array.isArray(p.rules)) {
        const scRule = p.rules.find((r: any) => r.attribute === "sales_channel_id");
        if (scRule && Array.isArray(scRule.values) && scRule.values.length > 0) {
          const matched = scRule.values.some((v: any) => v.value === cart.sales_channel_id);
          if (!matched && scRule.operator === "eq") continue;
        }
      }

      // Check region rule if present
      if (cart && cart.region_id && Array.isArray(p.rules)) {
        const regRule = p.rules.find((r: any) => r.attribute === "region.id" || r.attribute === "region_id");
        if (regRule && Array.isArray(regRule.values) && regRule.values.length > 0) {
          const matched = regRule.values.some((v: any) => v.value === cart.region_id);
          if (!matched && regRule.operator === "eq") continue;
        }
      }

      // Extract minimum purchase amount
      let minimumPurchase: number | null = null;

      // 1. Check promotion rules for subtotal / amount
      if (Array.isArray(p.rules)) {
        const subtotalRule = p.rules.find(
          (r: any) =>
            (r.attribute === "subtotal" ||
              r.attribute === "item_subtotal" ||
              r.attribute === "raw_subtotal" ||
              r.attribute === "total") &&
            (r.operator === "gte" || r.operator === "gt" || r.operator === "eq")
        );
        if (subtotalRule && subtotalRule.values?.[0]?.value) {
          const parsed = Number(subtotalRule.values[0].value);
          if (!isNaN(parsed) && parsed > 0) {
            minimumPurchase = parsed;
          }
        }
      }

      // 2. Check application method buy_rules
      if (!minimumPurchase && Array.isArray(p.application_method?.buy_rules)) {
        const buyRule = p.application_method.buy_rules.find(
          (r: any) =>
            (r.attribute === "subtotal" || r.attribute === "item_subtotal") &&
            (r.operator === "gte" || r.operator === "gt")
        );
        if (buyRule && buyRule.values?.[0]?.value) {
          const parsed = Number(buyRule.values[0].value);
          if (!isNaN(parsed) && parsed > 0) {
            minimumPurchase = parsed;
          }
        }
      }

      // 3. Check metadata (min_subtotal, minimum_purchase, min_order_amount)
      if (!minimumPurchase && p.metadata) {
        const metaVal =
          p.metadata.min_subtotal ??
          p.metadata.minimum_purchase ??
          p.metadata.min_amount ??
          p.metadata.min_order_amount;
        if (metaVal !== undefined && metaVal !== null) {
          const parsed = Number(metaVal);
          if (!isNaN(parsed) && parsed > 0) {
            minimumPurchase = parsed;
          }
        }
      }

      // Calculate discount presentation
      const discountType = p.application_method?.type || "percentage";
      const discountValue = Number(p.application_method?.value || 0);
      let discountLabel = "";
      if (discountType === "percentage") {
        discountLabel = `${discountValue}% OFF`;
      } else {
        discountLabel = `₹${discountValue.toLocaleString("en-IN")} OFF`;
      }

      // Cart evaluation if cart is available
      const cartSubtotal = Number(cart?.subtotal || 0);
      const isApplied =
        Array.isArray(cart?.promotions) &&
        cart.promotions.some(
          (cp: any) => cp.code?.toUpperCase() === p.code?.toUpperCase()
        );

      const isEligible = minimumPurchase ? cartSubtotal >= minimumPurchase : true;
      const remainingAmount = minimumPurchase
        ? Math.max(0, minimumPurchase - cartSubtotal)
        : 0;
      const progressPercent = minimumPurchase
        ? Math.min(100, Math.round((cartSubtotal / minimumPurchase) * 100))
        : 100;

      activeOffers.push({
        id: p.id,
        code: p.code,
        name: p.campaign?.name || p.code,
        description: p.campaign?.description || "",
        discount_type: discountType,
        discount_value: discountValue,
        discount_label: discountLabel,
        minimum_purchase: minimumPurchase,
        is_applied: isApplied,
        is_eligible: isEligible,
        remaining_amount: remainingAmount,
        progress_percent: progressPercent,
        metadata: p.metadata || {},
      });
    }

    res.json({ offers: activeOffers });
  } catch (error: any) {
    console.error("Error fetching store offers:", error);
    res.status(500).json({ error: "Failed to fetch offers", details: error.message });
  }
}
