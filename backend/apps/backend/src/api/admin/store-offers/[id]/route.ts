import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { deletePromotionsWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys, ModuleRegistrationName } from "@medusajs/framework/utils";

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

  try {
    await deletePromotionsWorkflow(req.scope).run({
      input: { ids: [id] }
    });

    res.status(200).json({ success: true, message: "Offer deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting offer:", error);
    res.status(500).json({ success: false, error: "Failed to delete offer." });
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const { name, discount, min_subtotal, display_on_website, status } = req.body as any;

  try {
    const promotionModule = req.scope.resolve(ModuleRegistrationName.PROMOTION);
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const { data: promotions } = await query.graph({
      entity: "promotion",
      fields: ["id", "code", "metadata", "application_method.*", "rules.*", "rules.values.*", "campaign.*"],
      filters: { id },
    });
    const promotion = (promotions as any[])[0];
    if (!promotion) {
      return res.status(404).json({ error: "Offer not found" });
    }

    const parsedMinSubtotal = min_subtotal !== undefined ? Number(min_subtotal) : undefined;

    const currentMetadata = promotion.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      ...(display_on_website !== undefined ? { display_on_website } : {}),
      ...(parsedMinSubtotal !== undefined ? { min_subtotal: parsedMinSubtotal > 0 ? parsedMinSubtotal : null } : {}),
    };

    await (promotionModule as any).updatePromotions([
      {
        id,
        status: (status || promotion.status || "active") as any,
        metadata: updatedMetadata,
        ...(discount !== undefined
          ? {
              application_method: {
                value: Number(discount),
              },
            }
          : {}),
      },
    ]);

    if (name !== undefined && promotion.campaign) {
      await promotionModule.updateCampaigns([
        {
          id: promotion.campaign.id,
          name: name.trim(),
        },
      ]);
    }

    if (parsedMinSubtotal !== undefined) {
      const existingSubRule = Array.isArray(promotion.rules)
        ? promotion.rules.find((r: any) => r.attribute === "subtotal" || r.attribute === "item_subtotal")
        : null;

      if (parsedMinSubtotal > 0) {
        if (existingSubRule) {
          await promotionModule.updatePromotionRules([
            {
              id: existingSubRule.id,
              values: [String(parsedMinSubtotal)],
            },
          ]);
        } else {
          await promotionModule.addPromotionRules(id, [
            {
              attribute: "subtotal",
              operator: "gte" as any,
              values: [String(parsedMinSubtotal)],
            },
          ]);
        }
      } else if (existingSubRule) {
        await promotionModule.removePromotionRules(id, [existingSubRule.id]);
      }
    }

    res.status(200).json({ success: true, message: "Offer updated successfully." });
  } catch (error: any) {
    console.error("Error updating offer:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update offer." });
  }
}
