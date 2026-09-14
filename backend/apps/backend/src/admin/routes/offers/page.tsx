import { defineRouteConfig } from "@medusajs/admin-sdk";
import { GiftSolid } from "@medusajs/icons";
import { Container, Heading, Text, Button } from "@medusajs/ui";
import { useState } from "react";

// In a real production setup, we would fetch promotions using the admin SDK hooks
// import { usePromotions } from "@medusajs/react-hook" (or similar depending on v2 packages)
// For this UI, we provide the layout and state for the Offers & Vouchers dashboard.

const OffersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Container className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Heading level="h1">Offers & Vouchers</Heading>
          <Text className="text-ui-fg-subtle mt-2">
            Manage your store's promotional offers, coupons, and public vouchers.
          </Text>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Create New Offer
        </Button>
      </div>

      <div className="bg-ui-bg-base border border-ui-border-base rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-ui-bg-subtle border-b border-ui-border-base text-ui-fg-subtle text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Offer Name</th>
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Display on Site</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border-base text-sm">
            {/* We can list promotions here. For now, it will direct admins to use the native Promotions page to create actual rules, or we can build the full form. */}
            <tr>
              <td className="px-6 py-4" colSpan={5}>
                <Text className="text-center text-ui-fg-subtle py-8">
                  Offers will appear here. Note: You can also manage complex rules in the native Promotions section.
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-ui-bg-base p-8 rounded-lg shadow-elevation-card-rest w-full max-w-2xl">
            <Heading level="h2" className="mb-6">Create New Offer</Heading>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Offer Name</label>
                <input type="text" className="w-full rounded-md border border-ui-border-base px-3 py-2" placeholder="Diwali Special" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Coupon Code</label>
                  <input type="text" className="w-full rounded-md border border-ui-border-base px-3 py-2" placeholder="DIWALI10" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Discount Value (%)</label>
                  <input type="number" className="w-full rounded-md border border-ui-border-base px-3 py-2" placeholder="10" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Voucher Image URL (Public)</label>
                <input type="text" className="w-full rounded-md border border-ui-border-base px-3 py-2" placeholder="https://..." />
                <Text className="text-xs text-ui-fg-subtle mt-1">
                  Upload an image via the Medusa File storage and paste the URL here.
                </Text>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="display" className="rounded" />
                <label htmlFor="display" className="text-sm font-medium">Display on Website</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-ui-border-base">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>Save Offer</Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

export default OffersPage;

export const config = defineRouteConfig({
  label: "Offers & Vouchers",
  icon: GiftSolid,
});
