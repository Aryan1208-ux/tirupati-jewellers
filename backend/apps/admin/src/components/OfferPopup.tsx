"use client";

import React, { useEffect, useState } from "react";
import { medusa } from "@/lib/medusa";

export default function OfferPopup() {
  const [offer, setOffer] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkOffers = async () => {
      try {
        // Check local storage for dismissal
        const dismissedAt = localStorage.getItem("offer_popup_dismissed");
        if (dismissedAt) {
          const dismissedTime = new Date(dismissedAt).getTime();
          const now = new Date().getTime();
          // 24 hour cooldown
          if (now - dismissedTime < 24 * 60 * 60 * 1000) {
            return;
          }
        }

        // Fetch active offers
        // Since we created a custom route on the backend:
        const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"}/store/offers`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.offers && data.offers.length > 0) {
            // Just take the first active offer for the popup
            setOffer(data.offers[0]);
            setShow(true);
          }
        }
      } catch (error) {
        console.error("Error fetching offers for popup:", error);
      }
    };

    checkOffers();
  }, []);

  if (!show || !offer) return null;

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("offer_popup_dismissed", new Date().toISOString());
  };

  const handleCopyCode = () => {
    if (offer.code) {
      navigator.clipboard.writeText(offer.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // We check metadata for voucher_image_url, fallback to a default luxury image if none
  const imageUrl = offer.campaign?.metadata?.voucher_image_url || "/image/luxury/prod_ring.jpg";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
      <div className="bg-cream max-w-md w-full shadow-2xl relative flex flex-col overflow-hidden animate-fade-in-up border border-gold/30">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="h-64 w-full relative">
          <img 
            src={imageUrl} 
            alt="Exclusive Offer" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cream to-transparent" />
        </div>

        <div className="p-8 text-center -mt-12 relative z-10">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-gold-dark font-bold mb-2">
            Exclusive Privilege
          </p>
          <h2 className="font-serif text-3xl text-charcoal mb-2">
            {offer.campaign?.name || "Special Offer"}
          </h2>
          <p className="font-sans text-sm text-charcoal-light mb-6">
            Apply the code below at checkout to redeem your exclusive benefit.
          </p>

          <div className="bg-white border border-dashed border-gold p-4 mb-6">
            <span className="font-mono text-xl text-charcoal font-bold tracking-wider">
              {offer.code}
            </span>
          </div>

          <button 
            onClick={handleCopyCode}
            className="w-full bg-[#0a0a0a] text-gold hover:bg-gold hover:text-black py-4 font-sans text-xs uppercase tracking-[0.2em] font-bold transition-colors"
          >
            {copied ? "COUPON COPIED!" : "COPY CODE"}
          </button>
          
          <button 
            onClick={handleClose}
            className="mt-4 text-xs font-sans text-charcoal-light hover:text-gold uppercase tracking-widest underline"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
