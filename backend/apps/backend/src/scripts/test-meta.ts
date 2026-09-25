import { ModuleRegistrationName } from "@medusajs/framework/utils";

export default async function testMetadata({ container }) {
  const promotionModule = container.resolve(ModuleRegistrationName.PROMOTION);
  
  try {
    const campaign = await promotionModule.createCampaigns({
      name: "Test Campaign Metadata",
      campaign_identifier: "TEST-META-123",
      metadata: {
        voucher_image_url: "https://example.com/image.jpg"
      }
    });
    
    console.log("Success! Campaign created:", campaign.id);
    console.log("Metadata:", campaign.metadata);
  } catch (err) {
    console.error("Failed to create campaign:", err.message);
  }
}
