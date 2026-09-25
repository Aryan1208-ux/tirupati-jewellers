import React from "react";
import ProductDetailView from "@/components/ProductDetailView";
import { getStoreProductByHandle } from "@/lib/medusa-categories";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getStoreProductByHandle(handle);

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
