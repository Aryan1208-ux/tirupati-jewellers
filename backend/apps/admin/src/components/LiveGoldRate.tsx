"use client";

import React, { useState, useEffect } from "react";

export default function LiveGoldRate() {
  // Base realistic rates for India (per gram)
  const [rate22k, setRate22k] = useState(6850);
  const [rate24k, setRate24k] = useState(7450);
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
    <div className="bg-[#070707] border-b border-gold/20 text-white py-1.5 px-4 text-xs font-sans">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${trend === "up" ? "bg-green-500" : trend === "down" ? "bg-red-500" : "bg-gold"} animate-pulse`} />
            <span className="text-white/70 uppercase tracking-widest text-[10px] font-bold">Live Market</span>
          </div>
          <div className="h-3 w-px bg-white/20 hidden sm:block"></div>
          <div className="flex gap-4">
            <span className="tracking-wide">
              <span className="text-gold-light mr-1">22K Gold:</span> 
              <span className="font-semibold">₹{rate22k.toLocaleString('en-IN')}/g</span>
            </span>
            <span className="tracking-wide">
              <span className="text-gold-light mr-1">24K Gold:</span> 
              <span className="font-semibold">₹{rate24k.toLocaleString('en-IN')}/g</span>
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
