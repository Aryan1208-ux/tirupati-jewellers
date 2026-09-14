"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function CartPage() {
  const { cart, loading, updateLineItem, removeItem, addPromotion, removePromotion } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const items = cart?.items || [];
  
  // Medusa cart totals
  const subtotal = cart?.subtotal ?? items.reduce(
    (sum: number, item: any) => sum + (item.unit_price || 85000) * item.quantity,
    0
  );
  const discountTotal = cart?.discount_total ?? 0;
  const grandTotal = cart?.total ?? (subtotal - discountTotal);

  const multiplier = cart?.currency_code?.toLowerCase() === "eur" ? 8900 : (cart?.currency_code?.toLowerCase() === "usd" ? 8500 : 1);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount * multiplier);
  };

  const formattedSubtotal = formatCurrency(subtotal);
  const formattedDiscount = formatCurrency(discountTotal);
  const formattedTotal = formatCurrency(grandTotal);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      await addPromotion(couponCode.trim());
      setCouponCode("");
    } catch (err: any) {
      setCouponError(err?.message || "This coupon is invalid or has expired.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async (code: string) => {
    try {
      await removePromotion(code);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !cart) {
    return (
      <div className="min-h-[60vh] bg-cream flex items-center justify-center font-serif text-lg text-charcoal-light">
        Opening your luxury shopping bag...
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Title */}
        <div className="text-center mb-12">
          <p className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-dark font-bold mb-2">
            YOUR CURATED SELECTION
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-normal text-charcoal">
            Shopping Bag
          </h1>
          <div className="w-16 h-[1px] bg-gold mx-auto mt-3" />
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-cream-dark p-12 text-center max-w-xl mx-auto shadow-sm">
            <span className="text-4xl text-gold mb-4 inline-block">🛍</span>
            <h2 className="font-display text-2xl text-charcoal mb-2">Your Bag is Empty</h2>
            <p className="font-serif text-sm text-charcoal/75 mb-8 leading-relaxed">
              Explore our handcrafted royal suites and discover your next heirloom piece.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-[#0a0a0a] text-gold px-8 py-3.5 font-sans text-xs uppercase tracking-[0.2em] font-bold hover:bg-gold hover:text-black transition-colors"
            >
              Explore High Jewellery
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item: any) => {
                const itemTotal = (item.unit_price || 85000) * item.quantity;
                const formattedItemPrice = formatCurrency(itemTotal);

                let img = "/image/luxury/prod_ring.jpg";
                let displayTitle = item.title;
                const lowerTitle = (item.title || "").toLowerCase();
                
                if (lowerTitle.includes("necklace") || lowerTitle.includes("sweatshirt") || lowerTitle.includes("choker")) {
                  img = "/image/luxury/prod_choker.jpg";
                } else if (lowerTitle.includes("earring") || lowerTitle.includes("sweatpants") || lowerTitle.includes("jhumka")) {
                  img = "/image/luxury/prod_earrings.jpg";
                } else if (lowerTitle.includes("bracelet") || lowerTitle.includes("shorts") || lowerTitle.includes("kada")) {
                  img = "/image/luxury/prod_bracelet.jpg";
                }

                return (
                  <div
                    key={item.id}
                    className="luxury-card p-6 flex flex-col sm:flex-row items-center gap-6"
                  >
                    <div className="w-24 h-24 bg-[#0a0a0a] overflow-hidden flex-shrink-0 border border-gold/30">
                      <img src={img} alt={item.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <p className="font-sans text-[10px] text-gold uppercase tracking-widest font-bold">
                        BIS 916 Hallmarked
                      </p>
                      <h3 className="font-serif text-xl text-charcoal mt-1">{displayTitle}</h3>
                      {item.variant?.title && item.variant.title !== "Default" && (
                        <p className="font-sans text-xs text-charcoal-light mt-0.5">
                          Size / Variant: {item.variant.title}
                        </p>
                      )}
                      <p className="font-serif text-xl text-gold-dark font-medium mt-2">
                        {formattedItemPrice}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center border border-cream-dark">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateLineItem(item.id, item.quantity - 1);
                          } else {
                            removeItem(item.id);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-cream"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-sans text-xs font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateLineItem(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-cream"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs font-sans text-red-700 hover:underline px-2"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-cream-dark p-8 shadow-sm">
              <h2 className="font-display text-xl text-charcoal mb-6 pb-4 border-b border-cream-dark font-normal">
                Order Treasury
              </h2>

              {/* Coupon Section */}
              <div className="mb-6 pb-6 border-b border-cream-dark">
                <label className="block font-sans text-xs font-semibold text-charcoal mb-2 uppercase tracking-wider">
                  Apply Privilege Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 border border-cream-dark px-3 py-2 font-sans text-sm focus:outline-none focus:border-gold"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim()}
                    className="bg-charcoal text-gold px-4 py-2 font-sans text-xs font-bold tracking-widest disabled:opacity-50"
                  >
                    {applyingCoupon ? "..." : "APPLY"}
                  </button>
                </div>
                {couponError && <p className="text-red-700 text-xs mt-2 font-sans">{couponError}</p>}
                
                {/* Active Promotions */}
                {cart?.promotions?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {cart.promotions.map((promo: any) => (
                      <div key={promo.id} className="flex justify-between items-center bg-cream px-3 py-2 border border-gold/30">
                        <span className="font-sans text-xs font-bold text-gold-dark uppercase flex items-center gap-2">
                          <span className="text-sm">🏷</span> {promo.code}
                        </span>
                        <button
                          onClick={() => handleRemoveCoupon(promo.code)}
                          className="text-charcoal hover:text-red-700 text-xs font-sans underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 font-sans text-xs text-charcoal/80 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal Amount</span>
                  <span className="font-semibold text-charcoal">{formattedSubtotal}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-gold-dark">
                    <span>Discount</span>
                    <span className="font-semibold">-{formattedDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Insured Express Transit</span>
                  <span className="text-green-800 font-semibold uppercase">Complimentary</span>
                </div>
                <div className="flex justify-between">
                  <span>Authenticity Certifications</span>
                  <span className="text-gold-dark font-semibold">Included</span>
                </div>
                <div className="border-t border-cream-dark pt-4 flex justify-between text-base font-serif text-charcoal font-semibold">
                  <span>Grand Total</span>
                  <span className="text-gold-dark text-xl">{formattedTotal}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center bg-[#0a0a0a] hover:bg-gold text-white hover:text-black py-4 font-sans text-xs uppercase tracking-[0.25em] font-bold transition-all duration-300 shadow-lg"
              >
                Proceed to Checkout
              </Link>

              <div className="mt-6 text-center">
                <Link href="/shop" className="font-sans text-xs text-charcoal-light hover:text-gold">
                  ← Continue Exploring High Jewellery
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
