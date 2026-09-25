"use client";

import React, { useState, useEffect } from "react";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

interface RateData {
  metal: string;
  purity_code: string;
  rate_per_gram: string;
  source_type: string;
}

export default function LiveGoldRate() {
  const [rates, setRates] = useState<RateData[]>([]);
  const [status, setStatus] = useState<"LIVE" | "STALE" | "NO_DATA" | "ERROR">("NO_DATA");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(`${MEDUSA_URL}/store/rates`);
        if (res.ok) {
          const data = await res.json();
          setRates(data.rates || []);
          setStatus(data.status || "NO_DATA");
          setLastUpdated(data.last_updated || null);
        } else {
          setStatus("ERROR");
        }
      } catch (err) {
        console.error("Failed to fetch rates:", err);
        setStatus("ERROR");
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    // Refresh from backend every 60 seconds — NOT random values
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  const rate24k = rates.find(r => r.metal === "GOLD" && r.purity_code === "24K");
  const rate22k = rates.find(r => r.metal === "GOLD" && r.purity_code === "22K");

  const statusDotColor = status === "LIVE" ? "bg-green-500 animate-pulse" : status === "STALE" ? "bg-amber-500" : "bg-gray-500";
  const statusLabel = status === "LIVE" ? "Live Market" : status === "STALE" ? "Market Delayed" : "Market Data";

  const formatUpdateTime = () => {
    if (!lastUpdated) return null;
    const diff = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000);
    if (diff < 1) return "Updated just now";
    if (diff < 60) return `Updated ${diff} min ago`;
    return `Updated ${new Date(lastUpdated).toLocaleString("en-IN")}`;
  };

  return (
    <div className="bg-gradient-to-r from-[#0d0d0d] via-[#141414] to-[#0d0d0d] border-b border-gold/25 py-2 px-4 font-sans text-[10px] sm:text-[11px] tracking-wider text-gold-light">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap font-medium">
          <span className="flex items-center gap-1.5 text-white font-bold bg-[#1f1a10] px-2 py-0.5 border border-gold/40 text-[9px] uppercase tracking-widest">
            <div className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
            {statusLabel}
          </span>
          <span>
            24K Gold:{" "}
            <strong className="text-white">
              {loading ? "..." : rate24k ? `₹${Number(rate24k.rate_per_gram).toLocaleString('en-IN')}/g` : "—"}
            </strong>
          </span>
          <span className="text-white/20">•</span>
          <span>
            22K Hallmarked:{" "}
            <strong className="text-white">
              {loading ? "..." : rate22k ? `₹${Number(rate22k.rate_per_gram).toLocaleString('en-IN')}/g` : "—"}
            </strong>
          </span>
          {lastUpdated && (
            <>
              <span className="text-white/20">•</span>
              <span className="text-white/40 text-[9px]">{formatUpdateTime()}</span>
            </>
          )}
        </div>

        {/* Trust Guarantees */}
        <div className="hidden lg:flex items-center gap-4 text-white/70 text-[10px] tracking-widest uppercase">
          <span>100% BIS 916 Hallmarked</span>
          <span className="text-gold">|</span>
          <span>IGI Certified Diamonds</span>
          <span className="text-gold">|</span>
          <span className="text-green-400 font-semibold">Free Insured All-India Shipping</span>
        </div>
      </div>
    </div>
  );
}
