import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys, ModuleRegistrationName } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    const { data: promotions } = await query.graph({
      entity: "promotion",
      fields: [
        "id",
        "code",
        "is_automatic",
        "status",
        "metadata",
        "campaign.*",
        "application_method.*",
        "rules.*",
        "rules.values.*",
      ],
      filters: {
        is_automatic: false,
        type: "standard",
      },
    });

    const enriched = (promotions as any[]).map((p) => {
      let minSubtotal: number | null = null;
      if (Array.isArray(p.rules)) {
        const subRule = p.rules.find((r: any) => r.attribute === "subtotal" || r.attribute === "item_subtotal");
        if (subRule && subRule.values?.[0]?.value) {
          minSubtotal = Number(subRule.values[0].value);
        }
      }
      if (!minSubtotal && p.metadata?.min_subtotal) {
        minSubtotal = Number(p.metadata.min_subtotal);
      }
      return {
        ...p,
        min_subtotal: minSubtotal,
      };
    });

    const sorted = enriched.sort((a: any, b: any) => {
      const dateA = a.campaign?.created_at ? new Date(a.campaign.created_at).getTime() : 0;
      const dateB = b.campaign?.created_at ? new Date(b.campaign.created_at).getTime() : 0;
      return dateB - dateA;
    });

    res.json({ offers: sorted });
  } catch (error: any) {
    console.error("Error fetching admin offers:", error);
    res.status(500).json({ error: "Failed to fetch offers", details: error.message });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { name, code, discount, voucher_image_url, display_on_website, min_subtotal } = req.body as any;

  if (!name || !code || !discount) {
    return res.status(400).json({ error: "Name, Code, and Discount are required fields." });
  }

  const parsedMinSubtotal = min_subtotal ? Number(min_subtotal) : 0;

  try {
    const rules: any[] = [];
    if (parsedMinSubtotal > 0) {
      rules.push({
        attribute: "subtotal",
        operator: "gte",
        values: [String(parsedMinSubtotal)],
      });
    }

    const { result } = await createPromotionsWorkflow(req.scope).run({
      input: {
        promotionsData: [
          {
            code: code.trim().toUpperCase(),
            type: "standard",
            status: "active",
            is_automatic: false,
            campaign: {
              name: name.trim(),
              campaign_identifier: code.trim().toUpperCase(),
            },
            application_method: {
              type: "percentage",
              target_type: "order",
              value: Number(discount),
            },
            rules: rules.length > 0 ? rules : undefined,
          },
        ],
      },
    });

    const promotion = result[0];
    const promotionModule = req.scope.resolve(ModuleRegistrationName.PROMOTION);
    
    await (promotionModule as any).updatePromotions([
      {
        id: promotion.id,
        metadata: {
          voucher_image_url: voucher_image_url?.trim() || "",
          display_on_website: display_on_website ? true : false,
          min_subtotal: parsedMinSubtotal > 0 ? parsedMinSubtotal : null,
        },
        status: "active" as any,
      },
    ]);

    res.status(200).json({ success: true, offer: { ...promotion, min_subtotal: parsedMinSubtotal } });
  } catch (error: any) {
    console.error("Error creating offer:", error);
    let errorMessage = error.message;
    if (errorMessage && errorMessage.includes("already exists")) {
      errorMessage = "Coupon code already exists.";
    }
    res.status(400).json({ success: false, error: errorMessage });
  }
}
