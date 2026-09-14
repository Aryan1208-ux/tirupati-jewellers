"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

interface ProductDetailViewProps {
  product: any;
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const { addToCart } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants?.[0]?.id || "default_variant"
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState(false);

  // Selected variant / Price
  const variant = product.variants?.find((v: any) => v.id === selectedVariantId) || product.variants?.[0];
  const priceAmount = product.price ?? variant?.calculated_price?.calculated_amount ?? 85000;
  const currency = variant?.calculated_price?.currency_code?.toUpperCase() ?? "INR";

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(priceAmount);

  // Determine luxury image & title
  const lowerTitle = (product.title || "").toLowerCase();
  const lowerHandle = (product.handle || "").toLowerCase();

  let mainImage = product.imageUrl || product.thumbnail || "/image/luxury/prod_ring.jpg";
  let displayTitle = product.title;
  let subtitle = product.purity || "24K Pure Gold • VVS1 Clarity Solitaire";

  if (lowerHandle.includes("t-shirt") && !product.purity) {
    mainImage = "/image/luxury/prod_ring.jpg";
    displayTitle = "Tirupati Empress Solitaire Diamond Ring";
    subtitle = "24K Solid Gold • VVS1 Clarity Solitaire Diamond";
  } else if (lowerHandle.includes("sweatshirt") && !product.purity) {
    mainImage = "/image/luxury/prod_choker.jpg";
    displayTitle = "Tirupati Royal Emerald & Polki Diamond Choker";
    subtitle = "Handcrafted 22K Gold • Natural Emeralds & Uncut Polki";
  } else if (lowerHandle.includes("sweatpants") && !product.purity) {
    mainImage = "/image/luxury/prod_earrings.jpg";
    displayTitle = "Tirupati Imperial Ruby & Temple Gold Jhumkas";
    subtitle = "South Indian Heritage 22K Temple Gold • Burma Rubies";
  } else if (lowerHandle.includes("shorts") && !product.purity) {
    mainImage = "/image/luxury/prod_bracelet.jpg";
    displayTitle = "Tirupati Eternal Diamond Tennis Bracelet Cuff";
    subtitle = "18K Solid Gold • Round Brilliant Cut Diamonds";
  }

  const [activeImage, setActiveImage] = useState(mainImage);

  const whatsappMessage = encodeURIComponent(
    `Hello Tirupati Jewellers! I am interested in purchasing "${displayTitle}" priced at ${formattedPrice}. Could you please share more details and video preview?`
  );

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(selectedVariantId, quantity);
      setAddedMessage(true);
      setTimeout(() => setAddedMessage(false), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-cream min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="mb-10 font-sans text-[11px] uppercase tracking-[0.25em] text-charcoal-light flex items-center gap-2">
          <Link href="/" className="hover:text-gold">Tirupati Home</Link>
          <span className="text-gold">/</span>
          <Link href="/shop" className="hover:text-gold">Jewellery Collection</Link>
          <span className="text-gold">/</span>
          <span className="text-charcoal font-bold">{displayTitle}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* High-Resolution Image Gallery */}
          <div className="lg:col-span-7 bg-white border border-cream-dark p-6 sticky top-28 shadow-sm">
            <div className="aspect-square bg-[#070707] overflow-hidden relative group">
              <img
                src={activeImage}
                alt={displayTitle}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 cursor-zoom-in"
              />
              <span className="absolute top-4 left-4 bg-[#070707]/90 text-gold text-[9px] font-sans font-bold tracking-[0.25em] px-3 py-1 uppercase border border-gold/40">
                {product.badge || "TIRUPATI SIGNATURE"}
              </span>
            </div>
            
            {/* Secondary Thumbnails */}
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => setActiveImage(mainImage)}
                className={`w-24 h-24 bg-[#070707] border-2 transition-colors overflow-hidden ${
                  activeImage === mainImage ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src={mainImage} alt={displayTitle} className="w-full h-full object-cover" />
              </button>
              <button
                onClick={() => setActiveImage("/image/luxury/bridal.jpg")}
                className={`w-24 h-24 bg-[#070707] border-2 transition-colors overflow-hidden ${
                  activeImage === "/image/luxury/bridal.jpg" ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src="/image/luxury/bridal.jpg" alt="Bridal Context" className="w-full h-full object-cover" />
              </button>
              <button
                onClick={() => setActiveImage("/image/luxury/craftsmanship.jpg")}
                className={`w-24 h-24 bg-[#070707] border-2 transition-colors overflow-hidden ${
                  activeImage === "/image/luxury/craftsmanship.jpg" ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img src="/image/luxury/craftsmanship.jpg" alt="Atelier Setting" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          {/* Product Details Info */}
          <div className="lg:col-span-5 bg-white border border-cream-dark p-8 sm:p-12 shadow-sm">
            
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-gold font-bold mb-2">
              {subtitle}
            </p>
            
            <h1 className="font-display text-3xl sm:text-4xl text-charcoal mb-4 font-normal">
              {displayTitle}
            </h1>

            <p className="font-serif text-3xl text-gold-dark font-medium mb-6">
              {formattedPrice}
            </p>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-cream/70 border border-cream-dark mb-6 font-sans text-xs">
              <div>
                <span className="text-charcoal-light uppercase text-[10px] tracking-wider block">Gold Purity:</span>
                <span className="font-bold text-charcoal">{product.purity || "100% BIS 916 Hallmarked"}</span>
              </div>
              <div>
                <span className="text-charcoal-light uppercase text-[10px] tracking-wider block">Diamond Grade:</span>
                <span className="font-bold text-charcoal">{product.diamondWeight || "Certified VVS1-EF"}</span>
              </div>
              {product.goldWeight && (
                <div>
                  <span className="text-charcoal-light uppercase text-[10px] tracking-wider block">Net Gold Wt:</span>
                  <span className="font-bold text-charcoal">{product.goldWeight}</span>
                </div>
              )}
              <div>
                <span className="text-charcoal-light uppercase text-[10px] tracking-wider block">Assurance:</span>
                <span className="font-bold text-green-700">Lifetime Buyback</span>
              </div>
            </div>

            <div className="border-t border-b border-cream-dark py-6 mb-8">
              <p className="font-serif text-base text-charcoal/80 leading-relaxed">
                {product.description ||
                  "Handcrafted with microscopic precision by master goldsmiths at Tirupati Jewellers, this signature creation embodies royal elegance and lifelong heirloom value."}
              </p>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <label className="block font-sans text-[11px] uppercase tracking-[0.2em] text-charcoal font-bold mb-3">
                Quantity:
              </label>
              <div className="flex items-center border border-cream-dark w-36">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 flex items-center justify-center text-charcoal hover:bg-cream text-base"
                >
                  -
                </button>
                <span className="flex-1 text-center font-sans text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-11 h-11 flex items-center justify-center text-charcoal hover:bg-cream text-base"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 mb-10">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className="w-full bg-[#070707] hover:bg-gold text-white hover:text-black py-4.5 font-sans text-xs uppercase tracking-[0.25em] font-bold transition-all duration-300 shadow-xl disabled:opacity-50"
              >
                {adding ? "ADDING TO SHOPPING BAG..." : "ADD TO SHOPPING BAG"}
              </button>

              <a
                href={`https://wa.me/919431002445?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-gold/60 bg-gold/10 hover:bg-gold hover:text-black text-gold-dark py-3.5 font-sans text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>💬</span> WhatsApp Stylist for this Piece
              </a>

              {addedMessage && (
                <div className="bg-[#070707] border border-gold/40 text-gold p-4 font-sans text-xs flex justify-between items-center shadow-lg">
                  <span>✓ Added to your shopping bag.</span>
                  <Link href="/cart" className="underline font-bold text-white hover:text-gold">
                    View Bag →
                  </Link>
                </div>
              )}
            </div>

            {/* Guarantee & Certifications */}
            <div className="grid grid-cols-2 gap-4 border-t border-cream-dark pt-8 text-[11px] font-sans text-charcoal/85">
              <div className="flex items-center gap-3">
                <span className="text-gold text-base">✦</span>
                <span>100% BIS Hallmarked 22K/24K</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gold text-base">◇</span>
                <span>Free Insured Express Transit</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gold text-base">♢</span>
                <span>Lifetime Buyback & Exchange</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gold text-base">✓</span>
                <span>Complimentary Custom Sizing</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
