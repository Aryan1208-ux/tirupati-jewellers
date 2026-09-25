"use client";

import React, { useState, useEffect } from "react";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

interface MetalRate {
  metal: string;
  purity_code: string;
  rate_per_gram: string;
}

export default function LiveGoldRate() {
  const [rates, setRates] = useState<MetalRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(`${MEDUSA_URL}/admin/rates/current`);
        if (res.ok) {
          const data = await res.json();
          setRates(data.rates || []);
        }
      } catch (err) {
        console.error("Failed to fetch rates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    // Refresh rates every minute
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  const rate22k = rates.find(r => r.metal === "GOLD" && r.purity_code === "22K");
  const rate24k = rates.find(r => r.metal === "GOLD" && r.purity_code === "24K");

  return (
    <div className="bg-[#070707] border-b border-gold/20 text-white py-1.5 px-4 text-xs font-sans">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full bg-gold`} />
            <span className="text-white/70 uppercase tracking-widest text-[10px] font-bold">Live Market</span>
          </div>
          <div className="h-3 w-px bg-white/20 hidden sm:block"></div>
          <div className="flex gap-4">
            <span className="tracking-wide">
              <span className="text-gold-light mr-1">22K Gold:</span> 
              <span className="font-semibold">
                {loading ? "..." : rate22k ? `₹${Number(rate22k.rate_per_gram).toLocaleString('en-IN')}/g` : "Not Configured"}
              </span>
            </span>
            <span className="tracking-wide">
              <span className="text-gold-light mr-1">24K Gold:</span> 
              <span className="font-semibold">
                {loading ? "..." : rate24k ? `₹${Number(rate24k.rate_per_gram).toLocaleString('en-IN')}/g` : "Not Configured"}
              </span>
            </span>
          </div>
        </div>
        <div className="text-[10px] text-white/50 tracking-widest uppercase hidden md:block">
          Rates exclusive of GST & Making Charges
        </div>
      </div>
    </div>
  );
}
