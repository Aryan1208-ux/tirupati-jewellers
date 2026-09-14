import React from "react";
import ProductDetailView from "@/components/ProductDetailView";
import { initialJewelleryProducts } from "@/lib/admin-products";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{
    handle: string;
  }>;
}

async function getProduct(handle: string) {
  // Check initial / admin catalogue first
  const customMatch = initialJewelleryProducts.find(
    p => p.handle === handle || handle.includes(p.category)
  );
  if (customMatch && !handle.includes("t-shirt") && !handle.includes("sweatshirt") && !handle.includes("sweatpants") && !handle.includes("shorts")) {
    return customMatch;
  }

  try {
    const res = await fetch(`http://localhost:9000/store/products?handle=${handle}`, {
      next: { revalidate: 10 },
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
    });
    if (!res.ok) return customMatch || null;
    const data = await res.json();
    return data.products?.[0] || customMatch || null;
  } catch (e) {
    console.error("Error fetching product:", e);
    return customMatch || null;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
