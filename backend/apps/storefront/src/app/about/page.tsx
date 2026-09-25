import React from "react";
import Link from "next/link";
import AboutUs from "@/components/AboutUs";

export default function AboutPage() {
  return (
    <div className="bg-cream text-charcoal min-h-screen">
      
      {/* HEADER BANNER */}
      <div className="relative bg-[#070707] text-white py-24 sm:py-32 overflow-hidden border-b border-gold/30">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="/image/luxury/craftsmanship.jpg"
            alt="About Tirupati Jewellers Craftsmanship"
            className="w-full h-full object-cover object-center grayscale"
          />
          <div className="absolute inset-0 bg-[#070707]/80" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-display text-4xl sm:text-6xl text-white mb-6">
            About Tirupati Jewellers
          </h1>
          <p className="font-sans text-xs tracking-[0.3em] uppercase text-gold-light font-bold">
            Established in 1997
          </p>
        </div>
      </div>



      {/* EXISTING ABOUT COMPONENT NARRATIVE */}
      <AboutUs />

    </div>
  );
}
