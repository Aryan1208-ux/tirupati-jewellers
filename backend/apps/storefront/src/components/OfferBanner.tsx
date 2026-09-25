"use client";

import React, { useEffect, useState } from "react";

export default function OfferBanner() {
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
        const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
        const response = await fetch(`${backendUrl}/store/offers`, {
          headers: {
            "Content-Type": "application/json",
            ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}),
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.offers && data.offers.length > 0) {
            setOffer(data.offers[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching offer banner:", error);
      }
    };
    fetchOffers();
  }, []);

  if (!offer) return null;

  return (
    <div className="bg-[#0a0a0a] text-gold py-2 px-4 text-center border-b border-gold/20">
      <p className="font-sans text-xs tracking-widest uppercase">
        <span className="font-bold mr-2">Exclusive Offer:</span>
        {offer.campaign?.name || "Special Privilege"} — Use code <span className="font-mono bg-gold/10 px-2 py-0.5 ml-1">{offer.code}</span>
      </p>
    </div>
  );
}
