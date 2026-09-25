import { JewelleryMetadata, validateJewelleryMetadata } from "./jewellery";
import { billingFetch } from "./billing-api";

const MEDUSA_URL = "/api/medusa";

export interface AdminCategory {
  id: string;
  name: string;
  handle: string;
  is_active: boolean;
  is_internal: boolean;
  rank: number;
  parent_category_id: string | null;
  category_children?: AdminCategory[];
}

export interface JewelleryProduct {
  id: string;
  title: string;
  handle: string;
  category: string;
  categoryId?: string;
  
  // New structured metadata
  jewellery?: JewelleryMetadata;
  
  // Legacy or root metadata
  badge?: string;
  
  price: number;
  imageUrl: string;
  description: string;
  inStock: boolean;
  createdAt: string;
}

/**
 * Fetch all categories directly from Medusa Admin API.
 */
export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const res = await billingFetch(`/admin/product-categories?limit=100`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`Categories request failed with status ${res.status}`);
    return [];
  }

  const data = await res.json();
  return data.product_categories || [];
}

/**
 * Fetch all products directly from Medusa Admin API with expanded relations.
 */
export async function fetchAdminProducts(): Promise<JewelleryProduct[]> {
  const res = await billingFetch(
    `/admin/products?limit=100&fields=*categories,*variants,*variants.prices,*sales_channels`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    console.error(`Products request failed with status ${res.status}`);
    return [];
  }

  const data = await res.json();
  return (data.products || []).map(mapMedusaProductToJewelleryProduct);
}

/**
 * Fetch a single product from Medusa Admin API.
 */
export async function fetchAdminProduct(id: string): Promise<JewelleryProduct | null> {
  const res = await billingFetch(
    `/admin/products/${id}?fields=*categories,*variants,*variants.prices,*sales_channels`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return mapMedusaProductToJewelleryProduct(data.product);
}

async function getDefaultSalesChannelId(): Promise<string | null> {
  try {
    const res = await billingFetch(`/admin/sales-channels?limit=1`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.sales_channels?.[0]?.id || null;
  } catch {
    return null;
  }
}

/**
 * Create a new fine jewellery product in Medusa backend via Admin API.
 */
export async function createAdminProduct(
  productData: {
    title: string;
    categoryId?: string;
    price: number;
    badge?: string;
    imageUrl?: string;
    description?: string;
    jewellery?: JewelleryMetadata;
  }
): Promise<{ success: boolean; product?: any; error?: string }> {
  try {
    const salesChannelId = await getDefaultSalesChannelId();

    const metadata: Record<string, any> = {};
    if (productData.badge) metadata.badge = productData.badge;
    if (productData.jewellery) {
      metadata.jewellery = validateJewelleryMetadata(productData.jewellery);
    }

    const payload: Record<string, any> = {
      title: productData.title.trim(),
      status: "published",
      description: productData.description || "",
      thumbnail: productData.imageUrl || "",
      metadata,
      options: [{ title: "Standard", values: ["Default"] }],
      variants: [
        {
          title: "Default",
          options: { Standard: "Default" },
          prices: [{ amount: Number(productData.price), currency_code: "inr" }],
        },
      ],
      categories: productData.categoryId ? [{ id: productData.categoryId }] : [],
    };

    if (salesChannelId) {
      payload.sales_channels = [{ id: salesChannelId }];
    }

    const res = await billingFetch(`/admin/products`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.message || `Failed to create product (Status ${res.status})` };
    }

    const data = await res.json();
    return { success: true, product: data.product };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error while creating product" };
  }
}

/**
 * Update a product in Medusa backend, carefully merging metadata.
 */
export async function updateAdminProduct(
  id: string,
  productData: {
    title?: string;
    categoryId?: string;
    price?: number;
    badge?: string;
    imageUrl?: string;
    description?: string;
    jewellery?: JewelleryMetadata;
  }
): Promise<{ success: boolean; product?: any; error?: string }> {
  try {
    // 1. Load current Medusa product to preserve metadata
    const getRes = await billingFetch(`/admin/products/${id}`);
    if (!getRes.ok) return { success: false, error: "Failed to load existing product for update." };
    const currentProduct = (await getRes.json()).product;

    // 2. Merge metadata carefully
    const newMetadata = { ...(currentProduct.metadata || {}) };
    if (productData.badge !== undefined) newMetadata.badge = productData.badge;
    if (productData.jewellery !== undefined) {
      if (productData.jewellery === null) {
        delete newMetadata.jewellery;
      } else {
        newMetadata.jewellery = validateJewelleryMetadata(productData.jewellery);
      }
    }

    // 3. Build payload
    const payload: Record<string, any> = {
      metadata: newMetadata,
    };
    if (productData.title) payload.title = productData.title.trim();
    if (productData.description !== undefined) payload.description = productData.description;
    if (productData.imageUrl !== undefined) payload.thumbnail = productData.imageUrl;
    if (productData.categoryId !== undefined) {
      payload.categories = productData.categoryId ? [{ id: productData.categoryId }] : [];
    }

    // 4. Save to Medusa
    const res = await billingFetch(`/admin/products/${id}`, {
      method: "POST", // Medusa v2 updates via POST /admin/products/:id
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.message || `Failed to update product (Status ${res.status})` };
    }

    const updatedData = await res.json();

    // 5. Update price if necessary
    if (productData.price !== undefined && currentProduct.variants?.length > 0) {
      const variantId = currentProduct.variants[0].id;
      // We must update the variant price
      // This is simplified; Medusa 2.0 requires updating the price list or variant price directly
      // In a real flow, we'd hit /admin/products/:id/variants/:var_id
      await billingFetch(`/admin/products/${id}/variants/${variantId}`, {
        method: "POST",
        body: JSON.stringify({
          prices: [{ amount: Number(productData.price), currency_code: "inr" }],
        }),
      });
    }

    return { success: true, product: updatedData.product };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error while updating product" };
  }
}

export async function deleteAdminProduct(id: string): Promise<boolean> {
  try {
    const res = await billingFetch(`/admin/products/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to delete product from Medusa:", err);
    return false;
  }
}

function mapMedusaProductToJewelleryProduct(p: any): JewelleryProduct {
  const categoryObj = p.categories?.[0];
  const variant = p.variants?.[0];
  const price = variant?.prices?.[0]?.amount ?? variant?.calculated_price?.calculated_amount ?? 0;
  
  let imageUrl = p.thumbnail || p.images?.[0]?.url || "";

  // Parse legacy and new metadata
  // Phase 16 / Phase 22: DO NOT guess missing metadata! Do not fall back to hardcoded jewellery values!
  // We strictly parse `p.metadata.jewellery` or map legacy `gold_weight` into the structure as a controlled read-only migration view.
  const rawMeta = p.metadata || {};
  let jewellery: JewelleryMetadata | undefined = rawMeta.jewellery;

  if (!jewellery) {
    // Phase 6: Legacy migration interpretation.
    // If there is legacy gold_weight or purity, we project it into the new format for display,
    // but we don't save it until the Admin edits the product.
    const hasLegacy = rawMeta.purity || rawMeta.gold_weight || rawMeta.diamond_weight;
    if (hasLegacy) {
      jewellery = {
        schema_version: 1,
        purity: rawMeta.purity ? String(rawMeta.purity) : undefined,
      };
      
      // Attempt to parse legacy "15.0g" into numbers safely without guessing
      if (rawMeta.gold_weight) {
        const gwStr = String(rawMeta.gold_weight).replace(/[^\d.]/g, '');
        const gw = Number(gwStr);
        if (!isNaN(gw) && gw > 0) jewellery.gross_weight_g = gw;
      }

      if (rawMeta.diamond_weight) {
        jewellery.diamond = {
          // If diamond_weight was "1.50ct VVS1-EF", we just store the whole string in a legacy display or ignore carat
          // We can't parse carat safely, so we omit carat to avoid corrupting data
        };
      }
    }
  }

  return {
    id: p.id,
    title: p.title || "Untitled Product",
    handle: p.handle || "",
    category: categoryObj?.name || "Uncategorized",
    categoryId: categoryObj?.id,
    
    jewellery: jewellery,
    badge: rawMeta.badge,
    
    price: Number(price),
    imageUrl: imageUrl,
    description: p.description || "",
    inStock: true,
    createdAt: p.created_at || new Date().toISOString(),
  };
}
