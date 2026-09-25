const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export interface StoreCategory {
  id: string;
  name: string;
  handle: string;
  description?: string | null;
  rank?: number;
  parent_category_id?: string | null;
  category_children?: StoreCategory[];
  metadata?: Record<string, any> | null;
}

export interface StoreProduct {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  thumbnail?: string | null;
  images?: Array<{ id: string; url: string }>;
  categories?: StoreCategory[];
  variants?: Array<{
    id: string;
    title: string;
    calculated_price?: {
      calculated_amount: number;
      currency_code: string;
    };
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
  }>;
  metadata?: Record<string, any> | null;
  [key: string]: any;
}

const REVALIDATE_SECONDS = process.env.NODE_ENV === "development" ? 2 : 10;

/**
 * Fetch public active product categories from Medusa Store API.
 * Uses publishable API key and Next.js ISR revalidation.
 */
export async function getStoreCategories(): Promise<StoreCategory[]> {
  try {
    const res = await fetch(
      `${MEDUSA_URL}/store/product-categories?fields=*category_children&limit=100`,
      {
        next: { revalidate: REVALIDATE_SECONDS, tags: ["categories"] },
        headers: {
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
      }
    );

    if (!res.ok) {
      console.error(`Failed to fetch store categories (Status ${res.status}):`, await res.text());
      return [];
    }

    const data = await res.json();
    const categories: StoreCategory[] = data.product_categories || [];

    // Sort by rank ascending
    return categories.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  } catch (err) {
    console.error("Error fetching store categories:", err);
    return [];
  }
}

let cachedRegionId: string | null = null;

async function getStoreRegionId(): Promise<string | null> {
  if (cachedRegionId) return cachedRegionId;
  try {
    const res = await fetch(`${MEDUSA_URL}/store/regions`, {
      next: { revalidate: 3600, tags: ["regions"] },
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.regions && data.regions.length > 0) {
        cachedRegionId = data.regions[0].id;
        return cachedRegionId;
      }
    }
  } catch (e) {
    console.error("Error fetching regions:", e);
  }
  return null;
}

/**
 * Fetch public products from Medusa Store API with category and search filtering.
 */
export async function getStoreProducts(
  categoryHandle?: string,
  searchQuery?: string
): Promise<StoreProduct[]> {
  try {
    const url = new URL(`${MEDUSA_URL}/store/products`);
    url.searchParams.set("limit", "100");
    url.searchParams.set("fields", "*categories,*variants,*variants.prices,*images,*thumbnail,+metadata");
    
    const regionId = await getStoreRegionId();
    if (regionId) {
      url.searchParams.set("region_id", regionId);
    }

    const res = await fetch(url.toString(), {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["products"] },
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch store products (Status ${res.status}):`, await res.text());
      return [];
    }

    const data = await res.json();
    let products: StoreProduct[] = data.products || [];

    // Filter by category handle if requested
    if (categoryHandle && categoryHandle !== "all") {
      const target = categoryHandle.toLowerCase();
      products = products.filter((product) =>
        product.categories?.some(
          (c) => c.handle?.toLowerCase() === target || c.id?.toLowerCase() === target
        )
      );
    }

    // Filter by search query if requested
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter((product) => {
        const title = product.title?.toLowerCase() || "";
        const desc = product.description?.toLowerCase() || "";
        const handle = product.handle?.toLowerCase() || "";
        return title.includes(q) || desc.includes(q) || handle.includes(q);
      });
    }

    return products;
  } catch (err) {
    console.error("Error fetching store products:", err);
    return [];
  }
}

/**
 * Fetch a single product by handle from Medusa Store API.
 */
export async function getStoreProductByHandle(handle: string): Promise<StoreProduct | null> {
  try {
    const regionId = await getStoreRegionId();
    const regionParam = regionId ? `&region_id=${regionId}` : "";
    const res = await fetch(
      `${MEDUSA_URL}/store/products?handle=${encodeURIComponent(handle)}&fields=*categories,*variants,*variants.prices,*images,*thumbnail,+metadata${regionParam}`,
      {
        next: { revalidate: REVALIDATE_SECONDS, tags: ["products"] },
        headers: {
          "x-publishable-api-key": PUBLISHABLE_KEY,
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.products?.[0] || null;
  } catch (err) {
    console.error(`Error fetching product with handle ${handle}:`, err);
    return null;
  }
}
