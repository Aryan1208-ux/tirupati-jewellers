"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#070707] text-white/70 border-t border-gold/30 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 pb-16">
        
        {/* BRAND & SEALS */}
        <div>
          <div className="flex flex-col mb-6">
            <span className="font-display text-2xl font-bold tracking-[0.25em] text-white">
              TIRUPATI
            </span>
            <span className="font-sans text-[9px] tracking-[0.45em] text-gold font-semibold uppercase mt-1">
              JEWELLERS
            </span>
          </div>
          <p className="font-serif text-sm text-white/60 leading-relaxed mb-6">
            Crafting royal gold and diamond heirlooms for three decades. Sculpted with timeless devotion and accredited purity.
          </p>
          <div className="inline-flex items-center gap-2 p-2.5 border border-gold/30 bg-[#111111]">
            <span className="text-gold text-xs">✦</span>
            <span className="font-sans text-[10px] uppercase tracking-wider text-gold-light font-bold">
              Govt. Registered BIS 916 Hallmark
            </span>
          </div>
        </div>

        {/* HIGH JEWELLERY COLLECTIONS */}
        <div>
          <h4 className="font-sans text-xs tracking-[0.25em] uppercase text-white font-bold mb-6">
            High Collections
          </h4>
          <ul className="space-y-3 font-sans text-xs tracking-wider">
            <li>
              <Link href="/shop?category=rings" className="hover:text-gold transition-colors duration-200">
                Solitaire & Polki Rings
              </Link>
            </li>
            <li>
              <Link href="/shop?category=necklaces" className="hover:text-gold transition-colors duration-200">
                Royal Chokers & Haars
              </Link>
            </li>
            <li>
              <Link href="/shop?category=earrings" className="hover:text-gold transition-colors duration-200">
                Temple Jhumkas & Chandbalis
              </Link>
            </li>
            <li>
              <Link href="/shop?category=bracelets" className="hover:text-gold transition-colors duration-200">
                Solid Gold Kadas & Tennis Cuffs
              </Link>
            </li>
            <li>
              <a href="/#bridal" className="hover:text-gold transition-colors duration-200">
                The Grand Royal Bridal Suite
              </a>
            </li>
          </ul>
        </div>

        {/* CONTACT & BOUTIQUE */}
        <div>
          <h4 className="font-sans text-xs tracking-[0.25em] uppercase text-white font-bold mb-6">
            Contact & Boutique
          </h4>
          <ul className="space-y-3 font-sans text-xs tracking-wider text-white/70">
            <li>
              <a href="tel:+919431002445" className="hover:text-gold text-white transition-colors duration-200 font-bold">
                Phone & WhatsApp: +91 94310 02445
              </a>
            </li>
            <li>
              <a href="mailto:Tjewellers13@gmail.com" className="hover:text-gold transition-colors duration-200">
                Email: Tjewellers13@gmail.com
              </a>
            </li>
            <li className="leading-relaxed text-white/60">
              Address: Shop no 120, 1st floor, GV mall, Boring road, Patna 800001
            </li>
            <li className="text-white/60">
              GST No: 10ARTPP3430D1Z3
            </li>
          </ul>
        </div>

        {/* HERITAGE, ASSURANCE & ADMIN */}
        <div>
          <h4 className="font-sans text-xs tracking-[0.25em] uppercase text-white font-bold mb-6">
            Store Administration
          </h4>
          <p className="font-serif text-sm text-white/60 mb-5 leading-relaxed">
            Staff & admin portal to add new jewellery, manage gold/diamond rates, and oversee orders.
          </p>
          <div className="mb-6">
            <a
              href={process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002/admin/login"}
              className="inline-flex items-center gap-2 border border-gold/50 bg-gold/10 hover:bg-gold hover:text-black text-gold-light px-4 py-2.5 font-sans text-[11px] uppercase tracking-wider font-bold transition-colors"
            >
              <span>👑</span> Admin Login Portal
            </a>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 font-sans gap-4">
        <p>© 2026 Tirupati Jewellers. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a href={process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002/admin/login"} className="hover:text-gold text-white/50">
            Admin Portal
          </a>
          <span className="text-white/20">|</span>
          <p className="tracking-[0.25em] uppercase text-[10px] text-gold-light/60">Sculpted with Royal Devotion.</p>
        </div>
      </div>
    </footer>
  );
}
