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
    purity?: string;
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
  
  // Format price in Indian Rupee format
  const formattedPrice = priceAmount === undefined || priceAmount === null
    ? "Price Unavailable"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency,
        maximumFractionDigits: 0,
      }).format(priceAmount);

  // Determine image
  let imageUrl = product.imageUrl || product.thumbnail;
  const lowerTitle = (product.title || "").toLowerCase();
  const lowerHandle = (product.handle || "").toLowerCase();

  if (!imageUrl || imageUrl.includes("amazonaws.com") || lowerHandle.includes("t-shirt") || lowerHandle.includes("sweatshirt") || lowerHandle.includes("sweatpants") || lowerHandle.includes("shorts")) {
    if (lowerTitle.includes("ring") || lowerHandle.includes("t-shirt")) {
      imageUrl = "/image/luxury/prod_ring.jpg";
    } else if (lowerTitle.includes("necklace") || lowerTitle.includes("pendant") || lowerTitle.includes("choker") || lowerHandle.includes("sweatshirt")) {
      imageUrl = "/image/luxury/prod_choker.jpg";
    } else if (lowerTitle.includes("earring") || lowerTitle.includes("jhumka") || lowerHandle.includes("sweatpants")) {
      imageUrl = "/image/luxury/prod_earrings.jpg";
    } else if (lowerTitle.includes("bracelet") || lowerTitle.includes("bangle") || lowerHandle.includes("shorts")) {
      imageUrl = "/image/luxury/prod_bracelet.jpg";
    } else if (lowerTitle.includes("bridal")) {
      imageUrl = "/image/luxury/bridal.jpg";
    } else {
      imageUrl = "/image/luxury/prod_ring.jpg";
    }
  }

  // Generate hallmarks & badges
  let badge = product.badge || "ROYAL EDITION";
  let subtitle = product.purity || "BIS 916 • 22K Gold";
  let displayTitle = product.title;

  if (lowerHandle.includes("t-shirt") && !product.purity) {
    displayTitle = "Tirupati Empress Solitaire Diamond Ring";
    subtitle = "24K Gold • VVS1 Clarity Solitaire";
    badge = "BESTSELLER";
  } else if (lowerHandle.includes("sweatshirt") && !product.purity) {
    displayTitle = "Tirupati Royal Emerald & Polki Choker";
    subtitle = "22K Pure Gold • Zambian Emeralds";
    badge = "ROYAL BRIDAL";
  } else if (lowerHandle.includes("sweatpants") && !product.purity) {
    displayTitle = "Tirupati Imperial Ruby Temple Jhumkas";
    subtitle = "22K Heritage Gold • Burma Rubies";
    badge = "HERITAGE TEMPLE";
  } else if (lowerHandle.includes("shorts") && !product.purity) {
    displayTitle = "Tirupati Eternal Diamond Tennis Bracelet";
    subtitle = "18K Solid Gold • Round Diamonds";
    badge = "SIGNATURE";
  }

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
      
      {/* BADGE */}
      <div className="absolute top-4 left-4 z-10">
        <span className="bg-[#070707] text-gold-light text-[9px] font-sans font-bold tracking-[0.2em] px-3 py-1 uppercase border border-gold/40">
          {badge}
        </span>
      </div>

      {/* IMAGE CONTAINER WITH ZOOM */}
      <div className="img-zoom-container relative aspect-square bg-[#0a0a0a] mb-5 overflow-hidden">
        <Link href={`/product/${product.handle}`}>
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        </Link>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-grow text-center">
        
        <p className="font-sans text-[10px] text-gold font-bold tracking-[0.25em] uppercase mb-1">
          {subtitle}
        </p>

        <Link href={`/product/${product.handle}`} className="group-hover:text-gold-dark transition-colors duration-200">
          <h3 className="font-serif text-xl sm:text-2xl font-normal text-charcoal tracking-wide mb-2 line-clamp-1 leading-snug">
            {displayTitle}
          </h3>
        </Link>

        <p className="font-serif text-xl text-gold-dark font-medium mt-auto mb-4">
          {formattedPrice}
        </p>

        {/* ACTIONS */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-cream-dark">
          <a
            href={`https://wa.me/919431002445?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-2 bg-[#f4f1ea] hover:bg-[#e7e0d0] text-[#128C7E] font-sans text-[10px] tracking-wider uppercase font-bold flex items-center justify-center gap-1 transition-colors"
          >
            <span>💬</span> WhatsApp
          </a>
          <button
            onClick={handleQuickAdd}
            disabled={adding || priceAmount === undefined || priceAmount === null}
            className="py-2.5 px-2 bg-[#070707] hover:bg-gold text-white hover:text-black font-sans text-[10px] tracking-wider uppercase font-bold transition-colors disabled:opacity-50"
          >
            {added ? "✓ Added" : adding ? "Adding..." : priceAmount === undefined || priceAmount === null ? "No Price" : "+ Add to Bag"}
          </button>
        </div>

      </div>

    </div>
  );
}
