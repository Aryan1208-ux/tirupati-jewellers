"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { trackActivity } from "@/lib/activity";

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

  React.useEffect(() => {
    trackActivity({
      event_type: "PRODUCT_VIEW",
      product_id: product.id,
      variant_id: product.variants?.[0]?.id,
    });
  }, [product.id, product.variants]);

  // Selected variant / Price
  const variant = product.variants?.find((v: any) => v.id === selectedVariantId) || product.variants?.[0];
  const priceAmount = product.price ?? variant?.calculated_price?.calculated_amount;
  const currency = variant?.calculated_price?.currency_code?.toUpperCase() ?? "INR";

  const formattedPrice = priceAmount != null ? new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(priceAmount) : "Price Unavailable";

  const displayTitle = product.title || "Untitled Product";
  let mainImage = (product.imageUrl || product.thumbnail || (product.images && product.images.length > 0 ? product.images[0].url : null)) ?? "";
  const isClothingDemoImage = mainImage && mainImage.includes("medusa-public-images");
  if (!mainImage || isClothingDemoImage) {
    mainImage = "/image/luxury/prod_ring.jpg";
  }

  // Phase 22 & Phase 23: Parse Metadata & DO NOT INVENT VALUES
  const rawMeta = product.metadata || {};
  const jMeta = rawMeta.jewellery;

  let subtitle = "Fine Jewellery";
  if (jMeta?.purity && jMeta?.metal_type) {
    subtitle = `${jMeta.purity} ${jMeta.metal_type}`;
  } else if (rawMeta.purity) {
    subtitle = String(rawMeta.purity);
  }
  
  const badge = rawMeta.badge || product.badge;
  const [activeImage, setActiveImage] = useState(mainImage);

  const whatsappMessage = encodeURIComponent(
    `Hello Tirupati Jewellers! I am interested in purchasing "${displayTitle}" priced at ${formattedPrice}. Could you please share more details?`
  );

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(selectedVariantId, quantity);
      
      trackActivity({
        event_type: "ADD_TO_CART",
        product_id: product.id,
        variant_id: selectedVariantId,
        metadata: { quantity },
      });

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
              {badge && (
                <span className="absolute top-4 left-4 bg-[#070707]/90 text-gold text-[9px] font-sans font-bold tracking-[0.25em] px-3 py-1 uppercase border border-gold/40">
                  {badge}
                </span>
              )}
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
            </div>
          </div>

          {/* Product Details Info */}
          <div className="lg:col-span-5 bg-white border border-cream-dark p-8 sm:p-12 shadow-sm">
            
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-gold font-bold mb-2 min-h-[16px]">
              {subtitle}
            </p>
            
            <h1 className="font-display text-3xl sm:text-4xl text-charcoal mb-4 font-normal">
              {displayTitle}
            </h1>

            <p className="font-serif text-3xl text-gold-dark font-medium mb-6">
              {formattedPrice}
            </p>

            {/* Structured Jewellery Specs Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-cream/70 border border-cream-dark mb-6 font-sans text-xs">
              <div>
                <span className="text-charcoal-light uppercase text-[10px] tracking-wider block">Purity:</span>
                <span className="font-bold text-charcoal">{jMeta?.purity || rawMeta.purity || "Not specified"}</span>
              </div>
              
              {(jMeta?.gross_weight_g || rawMeta.gold_weight) && (
                <div>
                  <span className="text-charcoal-light uppercase text-[10px] tracking-wider block">Gross Weight:</span>
                  <span className="font-bold text-charcoal">{jMeta?.gross_weight_g ? `${jMeta.gross_weight_g}g` : rawMeta.gold_weight}</span>
                </div>
              )}
              
              {jMeta?.net_weight_g && (
                <div>
                  <span className="text-charcoal-light uppercase text-[10px] tracking-wider block">Net Weight:</span>
                  <span className="font-bold text-charcoal">{jMeta.net_weight_g}g</span>
                </div>
              )}
              
              {jMeta?.hsn_sac && (
                <div>
                  <span className="text-charcoal-light uppercase text-[10px] tracking-wider block">HSN/SAC:</span>
                  <span className="font-bold text-charcoal">{jMeta.hsn_sac}</span>
                </div>
              )}

              {jMeta?.diamond && (
                <div className="col-span-2 mt-2 pt-2 border-t border-cream-dark/50">
                  <span className="text-charcoal-light uppercase text-[10px] tracking-wider block mb-1">Diamond Specifications:</span>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    {jMeta.diamond.carat && <span className="bg-white border border-cream-dark px-2 py-1">{jMeta.diamond.carat} Carat</span>}
                    {jMeta.diamond.color && <span className="bg-white border border-cream-dark px-2 py-1">Color: {jMeta.diamond.color}</span>}
                    {jMeta.diamond.clarity && <span className="bg-white border border-cream-dark px-2 py-1">Clarity: {jMeta.diamond.clarity}</span>}
                    {jMeta.diamond.cut && <span className="bg-white border border-cream-dark px-2 py-1">Cut: {jMeta.diamond.cut}</span>}
                  </div>
                </div>
              )}
              
              {jMeta?.certificate && (
                <div className="col-span-2 mt-2 pt-2 border-t border-cream-dark/50">
                  <span className="text-charcoal-light uppercase text-[10px] tracking-wider block mb-1">Certification:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-charcoal">{jMeta.certificate.provider} {jMeta.certificate.type}</span>
                    {jMeta.certificate.number && <span className="text-charcoal/60">#{jMeta.certificate.number}</span>}
                    {jMeta.certificate.url && (
                      <a href={jMeta.certificate.url} target="_blank" rel="noreferrer" className="text-gold hover:underline">Verify ↗</a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-b border-cream-dark py-6 mb-8">
              <p className="font-serif text-base text-charcoal/80 leading-relaxed">
                {product.description ||
                  "Handcrafted with microscopic precision by master goldsmiths at Tirupati Jewellers, this creation embodies royal elegance."}
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
                <span>100% BIS Hallmarked</span>
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
