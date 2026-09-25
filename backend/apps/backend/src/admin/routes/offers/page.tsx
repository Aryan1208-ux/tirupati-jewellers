import { defineRouteConfig } from "@medusajs/admin-sdk";
import { GiftSolid, Trash } from "@medusajs/icons";
import { Container, Heading, Text, Button, Toaster, toast, StatusBadge } from "@medusajs/ui";
import { useState, useEffect } from "react";

const OffersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [display, setDisplay] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/admin/store-offers");
      if (!res.ok) throw new Error("Failed to fetch offers");
      const data = await res.json();
      setOffers(data.offers || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleOpenCreate = () => {
    setEditingOffer(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer: any) => {
    setEditingOffer(offer);
    setName(offer.campaign?.name || "");
    setCode(offer.code || "");
    setDiscount(String(offer.application_method?.value || ""));
    setMinSubtotal(offer.min_subtotal ? String(offer.min_subtotal) : "");
    setImageUrl(offer.metadata?.voucher_image_url || "");
    setDisplay(offer.metadata?.display_on_website !== false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!name.trim() || !discount) {
      setFormError("Name and Discount are required.");
      return;
    }
    if (!editingOffer && !code.trim()) {
      setFormError("Code is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingOffer) {
        // Edit existing offer
        const res = await fetch(`/admin/store-offers/${editingOffer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            discount: Number(discount),
            min_subtotal: minSubtotal ? Number(minSubtotal) : 0,
            voucher_image_url: imageUrl,
            display_on_website: display,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update offer.");
        toast.success("Success", { description: "Offer updated successfully." });
      } else {
        // Create new offer
        const res = await fetch("/admin/store-offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            code,
            discount: Number(discount),
            min_subtotal: minSubtotal ? Number(minSubtotal) : 0,
            voucher_image_url: imageUrl,
            display_on_website: display,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create offer.");
        toast.success("Success", { description: "Offer created successfully." });
      }

      setIsModalOpen(false);
      resetForm();
      fetchOffers();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const res = await fetch(`/admin/store-offers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete offer");
      toast.success("Success", { description: "Offer deleted." });
      fetchOffers();
    } catch (err: any) {
      toast.error("Error", { description: err.message || "Failed to delete offer." });
    }
  };

  const resetForm = () => {
    setEditingOffer(null);
    setName("");
    setCode("");
    setDiscount("");
    setMinSubtotal("");
    setImageUrl("");
    setDisplay(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <Container className="p-8">
      <Toaster />
      <div className="flex items-center justify-between mb-8">
        <div>
          <Heading level="h1">Offers &amp; Vouchers</Heading>
          <Text className="text-ui-fg-subtle mt-2">
            Manage your store's promotional offers, coupons, and public vouchers with minimum purchase thresholds.
          </Text>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + Create New Offer
        </Button>
      </div>

      <div className="bg-ui-bg-base border border-ui-border-base rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-ui-bg-subtle border-b border-ui-border-base text-ui-fg-subtle text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">Offer Name</th>
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Discount</th>
              <th className="px-6 py-4 font-medium">Min. Purchase</th>
              <th className="px-6 py-4 font-medium">Display on Site</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border-base text-sm">
            {loading ? (
              <tr>
                <td className="px-6 py-8 text-center text-ui-fg-subtle" colSpan={7}>
                  Loading offers...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-6 py-8 text-center text-red-500" colSpan={7}>
                  {error}
                </td>
              </tr>
            ) : offers.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-center text-ui-fg-subtle" colSpan={7}>
                  Offers will appear here. Note: You can also manage complex rules in the native Promotions section.
                </td>
              </tr>
            ) : (
              offers.map((offer) => (
                <tr key={offer.id}>
                  <td className="px-6 py-4 font-medium">{offer.campaign?.name || "N/A"}</td>
                  <td className="px-6 py-4 font-mono text-xs">{offer.code}</td>
                  <td className="px-6 py-4 text-gold-dark font-medium">
                    {offer.application_method?.type === "fixed"
                      ? `₹${offer.application_method?.value?.toLocaleString("en-IN") || 0}`
                      : `${offer.application_method?.value || 0}%`}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {offer.min_subtotal && offer.min_subtotal > 0 ? (
                      `₹${Number(offer.min_subtotal).toLocaleString("en-IN")}`
                    ) : (
                      <span className="text-ui-fg-muted font-normal text-xs">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {offer.metadata?.display_on_website !== false ? (
                      <StatusBadge color="green">Yes</StatusBadge>
                    ) : (
                      <StatusBadge color="grey">No</StatusBadge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge color={offer.status === "active" ? "green" : "grey"}>
                      {offer.status || "active"}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="secondary" size="small" onClick={() => handleOpenEdit(offer)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="small" onClick={() => handleDelete(offer.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-ui-bg-base p-8 rounded-lg shadow-elevation-card-rest w-full max-w-2xl">
            <Heading level="h2" className="mb-6">
              {editingOffer ? `Edit Offer: ${editingOffer.code}` : "Create New Offer"}
            </Heading>
            
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Offer Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-ui-border-base px-3 py-2" 
                  placeholder="Diwali Special" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Coupon Code</label>
                  <input 
                    type="text" 
                    value={code}
                    disabled={!!editingOffer}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full rounded-md border border-ui-border-base px-3 py-2 uppercase disabled:bg-ui-bg-subtle" 
                    placeholder="DIWALI10" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Discount Value (%)</label>
                  <input 
                    type="number" 
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full rounded-md border border-ui-border-base px-3 py-2" 
                    placeholder="10" 
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Minimum Purchase Requirement (₹)</label>
                <input 
                  type="number" 
                  value={minSubtotal}
                  onChange={(e) => setMinSubtotal(e.target.value)}
                  className="w-full rounded-md border border-ui-border-base px-3 py-2" 
                  placeholder="50000" 
                  min="0"
                />
                <Text className="text-xs text-ui-fg-subtle mt-1">
                  Leave empty or 0 if this offer does not require a minimum cart purchase amount.
                </Text>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Voucher Image URL (Optional)</label>
                <input 
                  type="text" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-md border border-ui-border-base px-3 py-2" 
                  placeholder="https://..." 
                />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="display" 
                  checked={display}
                  onChange={(e) => setDisplay(e.target.checked)}
                  className="rounded border-ui-border-base text-ui-fg-interactive" 
                />
                <label htmlFor="display" className="text-sm font-medium cursor-pointer">Display on Website Offers Section</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-ui-border-base">
              <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} isLoading={submitting}>
                {editingOffer ? "Update Offer" : "Save Offer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default OffersPage;

export const config = defineRouteConfig({
  label: "Offers & Vouchers",
  icon: GiftSolid,
});
