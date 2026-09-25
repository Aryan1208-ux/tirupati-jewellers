"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    handle: string;
    thumbnail?: string | null;
    imageUrl?: string;
    description?: string | null;
    metadata?: any;
    price?: number;
    badge?: string;
    variants?: Array<{
      id: string;
      title: string;
      calculated_price?: {
        calculated_amount: number;
        currency_code: string;
      };
    }>;
    images?: Array<{ id: string; url: string }>;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Extract price
  const variant = product.variants?.[0];
  const priceAmount =
    product.price ??
    variant?.calculated_price?.calculated_amount;
  
  const currency = variant?.calculated_price?.currency_code?.toUpperCase() ?? "INR";
  
  const formattedPrice = priceAmount != null ? new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(priceAmount) : "Price Unavailable";

  // Determine image
  let imageUrl: string = (product.imageUrl || product.thumbnail || (product.images && product.images.length > 0 ? product.images[0].url : null)) ?? "";
  const isClothingDemoImage = imageUrl && imageUrl.includes("medusa-public-images");
  if (!imageUrl || isClothingDemoImage) {
    imageUrl = "/image/luxury/prod_ring.jpg"; // Single generic fallback for missing image
  }

  // Phase 22: Parse Metadata / DO NOT GUESS missing data
  const rawMeta = product.metadata || {};
  const jMeta = rawMeta.jewellery;

  // Render Subtitle safely
  let subtitle = "Fine Jewellery";
  if (jMeta?.purity && jMeta?.metal_type) {
    subtitle = `${jMeta.purity} ${jMeta.metal_type}`;
  } else if (rawMeta.purity) {
    subtitle = String(rawMeta.purity);
  }

  const badge = rawMeta.badge || product.badge;
  const displayTitle = product.title || "Untitled Product";

  const whatsappMessage = encodeURIComponent(
    `Hello Tirupati Jewellers! I am interested in purchasing "${displayTitle}" priced at ${formattedPrice}. Could you please share more details and video preview?`
  );

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    const variantIdToUse = variant?.id || "variant_default";
    setAdding(true);
    try {
      await addToCart(variantIdToUse, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="luxury-card group flex flex-col p-5 bg-white relative overflow-hidden">
      
      {/* IMAGE CONTAINER WITH ZOOM */}
      <div className="img-zoom-container relative aspect-square bg-[#0a0a0a] mb-5 overflow-hidden">
        <Link href={`/product/${product.handle}`}>
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        </Link>
        {badge && (
          <span className="absolute top-2 left-2 bg-[#070707]/90 text-gold text-[8px] font-sans font-bold tracking-[0.2em] px-2 py-0.5 uppercase border border-gold/40">
            {badge}
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-grow text-center">
        
        <p className="font-sans text-[10px] text-gold font-bold tracking-[0.25em] uppercase mb-1 min-h-[16px]">
          {subtitle}
        </p>

        <Link href={`/product/${product.handle}`} className="group-hover:text-gold-dark transition-colors duration-200">
          <h3 className="font-serif text-xl sm:text-2xl font-normal text-charcoal tracking-wide mb-2 line-clamp-1 leading-snug">
            {displayTitle}
          </h3>
        </Link>

        {jMeta?.gross_weight_g && (
          <p className="font-sans text-[10px] text-charcoal/50 mb-1">
            {jMeta.gross_weight_g}g
          </p>
        )}

        <p className="font-serif text-xl text-gold-dark font-medium mt-auto mb-4">
          {formattedPrice}
        </p>

        {/* ACTIONS */}
        <div className="pt-3 border-t border-cream-dark">
          <button
            onClick={handleQuickAdd}
            disabled={adding}
            className="w-full py-3 bg-[#070707] hover:bg-gold text-white hover:text-black font-sans text-[10px] tracking-wider uppercase font-bold transition-colors disabled:opacity-50"
          >
            {added ? "✓ Added" : adding ? "Adding..." : "+ Add to Bag"}
          </button>
        </div>

      </div>
    </div>
  );
}
