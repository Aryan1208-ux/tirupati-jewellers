import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    const { data: promotions } = await query.graph({
      entity: "promotion",
      fields: [
        "id",
        "code",
        "is_automatic",
        "campaign.*",
        "application_method.*",
      ],
    });

    const activeOffers = promotions.filter((p: any) => {
      // Must not be automatic
      if (p.is_automatic) return false;

      // Ensure it is currently active
      if (p.campaign) {
        const now = new Date();
        const start = p.campaign.starts_at ? new Date(p.campaign.starts_at) : null;
        const end = p.campaign.ends_at ? new Date(p.campaign.ends_at) : null;
        
        if (start && start > now) return false;
        if (end && end < now) return false;
      }
      
      return true;
    });

    res.json({ offers: activeOffers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
}
