"use client";

import React, { useState, useEffect } from "react";

export default function LiveGoldRate() {
  // Base realistic rates for India (per gram)
  const [rate22k, setRate22k] = useState(14255);
  const [rate24k, setRate24k] = useState(14968);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");

  useEffect(() => {
    // Simulate live market fluctuations every 5-10 seconds
    const interval = setInterval(() => {
      setRate22k((prev) => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        if (change > 0) setTrend("up");
        else if (change < 0) setTrend("down");
        return prev + change;
      });
      setRate24k((prev) => {
        const change = Math.floor(Math.random() * 5) - 2; 
        return prev + change;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#0d0d0d] via-[#141414] to-[#0d0d0d] border-b border-gold/25 py-2 px-4 font-sans text-[10px] sm:text-[11px] tracking-wider text-gold-light">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap font-medium">
          <span className="flex items-center gap-1.5 text-white font-bold bg-[#1f1a10] px-2 py-0.5 border border-gold/40 text-[9px] uppercase tracking-widest">
            <div className={`w-1.5 h-1.5 rounded-full ${trend === "up" ? "bg-green-500" : trend === "down" ? "bg-red-500" : "bg-gold"} animate-pulse`} />
            Live Market
          </span>
          <span>
            24K Gold: <strong className="text-white">₹{rate24k.toLocaleString('en-IN')}/g</strong>
          </span>
          <span className="text-white/20">•</span>
          <span>
            22K Hallmarked: <strong className="text-white">₹{rate22k.toLocaleString('en-IN')}/g</strong>
          </span>
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
