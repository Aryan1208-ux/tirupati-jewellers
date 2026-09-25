"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import LiveGoldRate from "./LiveGoldRate";

export default function Header() {
  const { cartCount } = useCart();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070707] text-white">
      
      {/* 1. TOP LIVE CERTIFIED GOLD RATE & ANNOUNCEMENT BAR */}
      <LiveGoldRate />

      {/* 2. MAIN LUXURY BRANDING NAVBAR */}
      <div className="border-b border-white/10 backdrop-blur-md bg-[#070707]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          
          {/* TIRUPATI JEWELLERS BRAND LOGO */}
          <Link href="/" className="flex flex-col items-center select-none group">
            <div className="flex items-center gap-2">
              <span className="text-gold text-lg">👑</span>
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-[0.25em] text-white group-hover:text-gold-light transition-colors duration-300">
                TIRUPATI
              </span>
            </div>
            <span className="font-sans text-[10px] tracking-[0.45em] text-gold font-bold uppercase mt-0.5">
              JEWELLERS
            </span>
          </Link>

          {/* NAVIGATION LINKS */}
          <nav className="hidden lg:flex space-x-9 font-sans text-xs tracking-[0.22em] uppercase font-medium">
            <Link href="/" className="relative py-2 text-white/90 hover:text-gold transition-colors duration-300 group">
              Home
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/shop" className="relative py-2 text-white/90 hover:text-gold transition-colors duration-300 group">
              Shop
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <a href="/#collections" className="relative py-2 text-white/90 hover:text-gold transition-colors duration-300 group">
              Collections
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
            </a>
            <Link href="/about" className="relative py-2 text-white/90 hover:text-gold transition-colors duration-300 group">
              About Us
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/contact" className="relative py-2 text-white/90 hover:text-gold transition-colors duration-300 group">
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* RIGHT ACTION ICONS */}
          <div className="flex items-center space-x-5 sm:space-x-6">
            
            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-white/80 hover:text-gold transition-colors focus:outline-none"
              aria-label="Search Jewellery"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Shopping Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-white/80 hover:text-gold transition-colors focus:outline-none flex items-center gap-1.5"
              aria-label="Shopping Cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="bg-gold-gradient-bg text-[#070707] text-[10px] font-bold px-2 py-0.5 rounded-full font-sans shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>



            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white/80 hover:text-gold transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

          </div>

        </div>
      </div>

      {/* SEARCH OVERLAY */}
      {searchOpen && (
        <div className="bg-[#111111] border-b border-gold/30 py-8 px-4 shadow-2xl transition-all duration-300">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex items-center gap-3">
            <input
              type="text"
              placeholder="Search Tirupati Jewellers: Gold necklaces, solitaire diamond rings, temple jhumkas, kadas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] text-white px-5 py-3.5 border border-white/20 rounded-none focus:outline-none focus:border-gold font-sans text-xs tracking-wider"
              autoFocus
            />
            <button
              type="submit"
              className="bg-gold hover:bg-gold-light text-[#070707] px-8 py-3.5 font-sans text-xs tracking-[0.2em] uppercase font-bold transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-3.5 text-white/60 hover:text-white border border-white/15"
            >
              ✕
            </button>
          </form>
        </div>
      )}

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0d0d0d] border-b border-white/10 font-sans uppercase tracking-[0.2em] text-xs">
          <div className="px-6 pt-4 pb-8 space-y-5">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-white/5 hover:text-gold transition-colors"
            >
              Home
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-white/5 hover:text-gold transition-colors"
            >
              Jewellery Collection
            </Link>
            <a
              href="/#collections"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-white/5 hover:text-gold transition-colors"
            >
              Collections
            </a>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-white/5 hover:text-gold transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-white/5 hover:text-gold transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      )}

    </header>
  );
}
