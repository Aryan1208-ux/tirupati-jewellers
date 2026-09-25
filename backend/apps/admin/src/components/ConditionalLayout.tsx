"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import LiveGoldRate from "@/components/LiveGoldRate";
import { CartProvider } from "@/context/CartContext";
import OfferPopup from "@/components/OfferPopup";
import OfferBanner from "@/components/OfferBanner";

/**
 * Conditionally renders storefront chrome (Header, Footer, Cart, etc.)
 * only on non-admin routes. Admin routes (/admin/*) render children directly
 * without any storefront wrapper elements.
 */
export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    // Admin pages: render children directly — no storefront chrome
    return <>{children}</>;
  }

  // Public storefront pages: full storefront layout
  return (
    <CartProvider>
      <OfferBanner />
      <LiveGoldRate />
      <Header />
      <OfferPopup />
      <main className="flex-grow">
        {children}
      </main>
      <WhatsAppButton />
      <Footer />
    </CartProvider>
  );
}
