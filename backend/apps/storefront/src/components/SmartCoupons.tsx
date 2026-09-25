"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCart } from "@/context/CartContext";

interface Offer {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  discount_label: string;
  minimum_purchase: number | null;
  is_applied: boolean;
  is_eligible: boolean;
  remaining_amount: number;
  progress_percent: number;
  metadata?: any;
}

interface SmartCouponsProps {
  className?: string;
}

export default function SmartCoupons({ className = "" }: SmartCouponsProps) {
  const { cart, addPromotion, removePromotion } = useCart();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Manual input state
  const [manualCode, setManualCode] = useState<string>("");
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [removingCode, setRemovingCode] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const items = cart?.items || [];
  const calculatedSubtotal = items.reduce(
    (sum: number, item: any) => sum + (Number(item.unit_price) || 0) * (item.quantity || 1),
    0
  );
  const cartSubtotal = Number(cart?.subtotal ?? calculatedSubtotal);
  const appliedPromoCodes: string[] = (cart?.promotions?.map((p: any) => p.code?.toUpperCase()) || []).filter(Boolean);

  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

  const currencyCode = (cart?.currency_code || "INR").toUpperCase();

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat(currencyCode === "INR" ? "en-IN" : "en-US", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: currencyCode === "INR" ? 0 : 2,
      }).format(amount);
    } catch {
      return `${currencyCode} ${amount.toLocaleString()}`;
    }
  };

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const url = new URL(`${backendUrl}/store/offers`);
      if (cart?.id) {
        url.searchParams.set("cart_id", cart.id);
      }

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load offers (status ${res.status})`);
      }

      const data = await res.json();
      setOffers(data.offers || []);
    } catch (err: any) {
      console.error("Error fetching coupons:", err);
      setFetchError("Unable to load available offers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [backendUrl, publishableKey, cart?.id]);

  useEffect(() => {
    fetchOffers();

    // Auto-sync when returning to the tab (e.g. after updating Medusa Admin)
    const handleFocus = () => {
      fetchOffers();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchOffers]);

  const handleApply = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setApplyingCode(trimmed);
    setActionError(null);
    setActionSuccess(null);

    try {
      await addPromotion(trimmed);
      setActionSuccess(`Offer "${trimmed}" applied successfully!`);
      setManualCode("");
      // Refresh offers to sync applied statuses
      fetchOffers();
    } catch (err: any) {
      setActionError(err.message || "Failed to apply promotion.");
    } finally {
      setApplyingCode(null);
    }
  };

  const handleRemove = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    setRemovingCode(trimmed);
    setActionError(null);
    setActionSuccess(null);

    try {
      await removePromotion(trimmed);
      setActionSuccess(`Offer "${trimmed}" removed.`);
      fetchOffers();
    } catch (err: any) {
      setActionError(err.message || "Failed to remove promotion.");
    } finally {
      setRemovingCode(null);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* 1. MANUAL COUPON INPUT SECTION */}
      <div>
        <label
          htmlFor="manual-coupon-input"
          className="block font-sans text-xs font-semibold text-charcoal mb-2 uppercase tracking-wider"
        >
          Apply Privilege Code
        </label>
        <div className="flex gap-2">
          <input
            id="manual-coupon-input"
            type="text"
            value={manualCode}
            onChange={(e) => {
              setManualCode(e.target.value.toUpperCase());
              if (actionError) setActionError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply(manualCode);
              }
            }}
            placeholder="ENTER COUPON CODE"
            className="flex-1 border border-cream-dark bg-white px-3 py-2.5 font-sans text-xs uppercase tracking-wider text-charcoal focus:outline-none focus:border-gold"
          />
          <button
            type="button"
            onClick={() => handleApply(manualCode)}
            disabled={!manualCode.trim() || applyingCode === manualCode.trim().toUpperCase()}
            className="bg-charcoal text-gold hover:bg-gold hover:text-black px-5 py-2.5 font-sans text-xs font-bold tracking-widest uppercase transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Apply manual coupon code"
          >
            {applyingCode === manualCode.trim().toUpperCase() ? "..." : "APPLY"}
          </button>
        </div>

        {/* Action Error / Success Feedback */}
        {actionError && (
          <p className="text-red-700 text-xs mt-2 font-sans flex items-center gap-1.5" role="alert">
            <span>⚠️</span> {actionError}
          </p>
        )}
        {actionSuccess && (
          <p className="text-green-800 text-xs mt-2 font-sans flex items-center gap-1.5" role="status">
            <span>✓</span> {actionSuccess}
          </p>
        )}

        {/* Active Applied Promotions Pill Box */}
        {appliedPromoCodes.length > 0 && (
          <div className="mt-3 space-y-2">
            {appliedPromoCodes.map((code) => {
              const matchedOffer = offers.find((o) => o.code.toUpperCase() === code);
              return (
                <div
                  key={code}
                  className="flex justify-between items-center bg-[#fbf9f5] px-3.5 py-2.5 border border-gold/40 shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gold-dark text-sm">🏷</span>
                    <div>
                      <span className="font-mono text-xs font-bold text-gold-dark tracking-wider">
                        {code}
                      </span>
                      {matchedOffer?.discount_label && (
                        <span className="ml-2 font-sans text-[11px] text-charcoal/70">
                          ({matchedOffer.discount_label})
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(code)}
                    disabled={removingCode === code}
                    className="text-charcoal hover:text-red-700 font-sans text-[11px] font-medium underline tracking-wider uppercase disabled:opacity-50"
                    aria-label={`Remove coupon ${code}`}
                  >
                    {removingCode === code ? "Removing..." : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. AVAILABLE OFFERS SECTION */}
      <div className="pt-4 border-t border-cream-dark">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-sans text-[11px] font-bold tracking-[0.2em] text-charcoal uppercase flex items-center gap-1.5">
            <span className="text-gold">✦</span> Available Offers
          </h3>
          <span className="text-[10px] font-sans text-charcoal-light tracking-wider">
            {offers.length} {offers.length === 1 ? "Offer" : "Offers"}
          </span>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-6 text-center space-y-2 bg-[#fdfbf7] border border-cream-dark p-4">
            <div className="inline-block animate-spin text-gold text-lg">✦</div>
            <p className="font-serif text-xs text-charcoal-light italic">
              Discovering exclusive royal privileges...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && fetchError && (
          <div className="p-4 bg-red-50/50 border border-red-200 text-center space-y-2">
            <p className="font-sans text-xs text-red-700">{fetchError}</p>
            <button
              type="button"
              onClick={fetchOffers}
              className="text-[11px] font-sans font-bold text-charcoal underline uppercase tracking-wider hover:text-gold"
            >
              Retry
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !fetchError && offers.length === 0 && (
          <div className="py-4 text-center bg-[#fdfbf7] border border-cream-dark px-4">
            <p className="font-sans text-xs text-charcoal-light">
              No offers are currently available.
            </p>
          </div>
        )}

        {/* OFFERS LIST */}
        {!loading && !fetchError && offers.length > 0 && (
          <div className="space-y-3">
            {offers.map((offer) => {
              const isApplied = appliedPromoCodes.includes(offer.code.toUpperCase());
              const minPurchase = offer.minimum_purchase;
              const hasMinPurchase = minPurchase !== null && minPurchase > 0;

              // Reactive calculation using current cartSubtotal
              const remaining = hasMinPurchase ? Math.max(0, minPurchase - cartSubtotal) : 0;
              const isEligible = hasMinPurchase ? cartSubtotal >= minPurchase : true;
              const progressPercent = hasMinPurchase
                ? Math.min(100, Math.round((cartSubtotal / minPurchase) * 100))
                : 100;

              const isApplyingThis = applyingCode === offer.code.toUpperCase();
              const isRemovingThis = removingCode === offer.code.toUpperCase();

              const displayDiscount =
                offer.discount_type === "percentage"
                  ? `${offer.discount_value}% OFF`
                  : `${formatCurrency(offer.discount_value)} OFF`;

              return (
                <div
                  key={offer.id}
                  className={`p-4 border transition-all duration-300 relative ${
                    isApplied
                      ? "bg-[#faf7f2] border-gold shadow-sm"
                      : isEligible
                      ? "bg-white border-gold/40 hover:border-gold shadow-xs"
                      : "bg-[#fcfbf9] border-cream-dark"
                  }`}
                >
                  {/* Card Header: Code & Discount */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="inline-block font-mono text-xs font-bold text-charcoal tracking-widest bg-cream px-2 py-0.5 border border-cream-dark">
                        {offer.code}
                      </span>
                      {offer.name && offer.name !== offer.code && (
                        <p className="font-serif text-xs text-charcoal/80 mt-1">
                          {offer.name}
                        </p>
                      )}
                    </div>
                    <span className="font-sans text-xs font-bold text-gold-dark bg-gold/10 px-2 py-0.5 border border-gold/30 whitespace-nowrap">
                      {displayDiscount}
                    </span>
                  </div>

                  {/* Threshold & Progress Information */}
                  <div className="my-2.5 font-sans text-[11px]">
                    {hasMinPurchase ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-charcoal-light">
                          <span>Minimum purchase:</span>
                          <span className="font-medium text-charcoal">
                            {formatCurrency(minPurchase)}
                          </span>
                        </div>

                        {/* Progress Indicator */}
                        {isEligible ? (
                          <div className="flex items-center gap-1.5 text-green-700 font-medium">
                            <span>✓</span>
                            <span>Coupon unlocked &amp; eligible</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-charcoal-light mb-1">
                              <span>Add {formatCurrency(remaining)} more to unlock</span>
                              <span className="font-semibold text-gold-dark">{progressPercent}%</span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div className="w-full h-1.5 bg-cream-dark rounded-full overflow-hidden">
                              <div
                                className="h-full bg-linear-to-r from-gold to-gold-dark transition-all duration-500 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-charcoal-light flex items-center gap-1">
                        <span>✓</span> No minimum purchase required
                      </p>
                    )}
                  </div>

                  {/* Actions: Apply / Remove Button */}
                  <div className="pt-2 border-t border-cream-dark/60 flex justify-end items-center">
                    {isApplied ? (
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-[11px] font-semibold text-green-700 flex items-center gap-1">
                          ✓ Applied
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemove(offer.code)}
                          disabled={isRemovingThis}
                          className="font-sans text-[11px] text-charcoal hover:text-red-700 underline uppercase tracking-wider"
                          aria-label={`Remove offer ${offer.code}`}
                        >
                          {isRemovingThis ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApply(offer.code)}
                        disabled={!isEligible || isApplyingThis}
                        className={`px-4 py-1.5 font-sans text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${
                          isEligible
                            ? "bg-charcoal text-gold hover:bg-gold hover:text-black cursor-pointer shadow-xs"
                            : "bg-cream text-charcoal/40 border border-cream-dark cursor-not-allowed"
                        }`}
                        aria-label={
                          isEligible
                            ? `Apply coupon ${offer.code}`
                            : `Coupon locked. Add ${formatCurrency(remaining)} more to unlock.`
                        }
                      >
                        {isApplyingThis
                          ? "APPLYING..."
                          : isEligible
                          ? "APPLY"
                          : `LOCKED`}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
