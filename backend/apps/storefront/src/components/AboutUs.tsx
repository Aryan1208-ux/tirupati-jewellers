"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

const quotes = [
  "Jewellery is not just worn. It becomes a part of your story.",
  "Some memories fade with time. The right piece of jewellery makes them timeless.",
  "Crafted for today. Cherished for generations.",
  "Every jewel carries a story. Every story deserves to shine.",
  "Tradition in every detail. Elegance in every design.",
];

export default function AboutUs() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Quote rotation
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);

    return () => clearInterval(quoteInterval);
  }, []);

  useEffect(() => {
    // Intersection observer for subtle reveals
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      id="about" 
      className="py-28 bg-[#070707] text-white overflow-hidden relative"
    >
      {/* 1989 Watermark Background */}
      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="text-center">
          <span className="font-display text-[15vw] leading-none text-white/[0.02] font-bold block select-none">
            1997
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-28">
          
          {/* Left: Heritage Image */}
          <div className={`transition-all duration-1000 delay-100 ease-out ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
            <div className="border border-gold/40 p-3 bg-[#111111]/80 backdrop-blur-md">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="/image/luxury/craftsmanship.jpg"
                  alt="Tirupati Jewellers Craftsmanship and Heritage"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                />
              </div>
            </div>
          </div>

          {/* Right: Narrative */}
          <div className={`transition-all duration-1000 delay-300 ease-out ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}>
            <header className="mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="text-gold text-xs">✦</span>
                <h2 className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-light font-bold">
                  ABOUT TIRUPATI JEWELLERS
                </h2>
              </div>
              <h3 className="font-display text-3xl sm:text-5xl font-normal text-white mb-6 leading-tight">
                More Than Jewellery.<br />
                <span className="italic font-serif text-gold-light">A Legacy of Trust Since 1997.</span>
              </h3>
              <p className="font-sans text-sm text-gold tracking-widest uppercase mb-8">
                Crafting timeless pieces for life's most precious moments.
              </p>
            </header>

            <div className="space-y-6 font-serif text-base text-white/80 leading-relaxed font-light mb-10">
              <p>
                Tirupati Jewellers was established in 1997 with a simple yet enduring vision — to bring timeless jewellery, honest craftsmanship, and trusted service to every customer.
              </p>
              <p>
                For decades, jewellery has been more than an ornament to us. It has been a part of life's most meaningful moments — a wedding, a celebration, a new beginning, or a cherished gift passed from one generation to the next.
              </p>
              <p>
                Our journey has been built on trust, quality, craftsmanship, and relationships. Every piece we offer is carefully selected and crafted with an eye for detail, combining traditional artistry with contemporary elegance.
              </p>
              <p>
                From timeless gold classics to elegant silver creations and modern designs, we believe every piece should have a story of its own.
              </p>
            </div>

            <Link
              href="/shop"
              className="inline-block bg-gold hover:bg-gold-light text-[#070707] px-8 py-4 font-sans text-xs tracking-[0.2em] uppercase font-bold transition-all duration-300 shadow-xl"
            >
              Explore Our Collection
            </Link>
          </div>
        </div>

        {/* Our Promise & Legacy */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 border-t border-white/10 transition-all duration-1000 delay-500 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          
          {/* Promise */}
          <div className="bg-[#111111]/50 border border-white/5 p-8 sm:p-12">
            <h4 className="font-display text-2xl text-gold-light mb-6">Our Promise</h4>
            <p className="font-serif text-base text-white/80 leading-relaxed font-light mb-6">
              At Tirupati Jewellers, we believe that when you purchase jewellery, you're not simply buying something beautiful — you're investing in a memory that can last for generations.
            </p>
            <div className="font-sans text-[11px] tracking-widest uppercase text-gold space-y-2">
              <p>Quality you can trust.</p>
              <p>Craftsmanship you can cherish.</p>
              <p>A legacy you can pass on.</p>
            </div>
          </div>

          {/* Legacy & Quotes */}
          <div className="flex flex-col justify-between py-4">
            <div>
              <p className="font-serif text-xl sm:text-2xl text-white font-light italic leading-relaxed mb-6">
                "After more than three decades, our greatest achievement isn't simply the jewellery we've created — it's the trust we've earned from generations of customers."
              </p>
              <p className="font-sans text-xs text-white/50 tracking-widest uppercase">
                Tirupati Jewellers — Celebrating life's precious moments since 1997.
              </p>
            </div>
            
            {/* Quote Carousel */}
            <div className="mt-12 h-24 relative flex items-center">
              <div className="w-12 h-[1px] bg-gold absolute top-0 left-0" />
              {quotes.map((quote, index) => (
                <p 
                  key={index}
                  className={`absolute font-display text-lg sm:text-xl text-gold-light transition-opacity duration-1000 ${
                    index === currentQuoteIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                >
                  "{quote}"
                </p>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
