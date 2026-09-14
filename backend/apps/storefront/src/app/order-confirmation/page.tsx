"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id") || "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const name = searchParams.get("name") || "Valued Customer";

  return (
    <div className="bg-white border border-cream-dark p-10 sm:p-16 max-w-2xl mx-auto text-center shadow-lg">
      <div className="w-16 h-16 bg-gold/10 border-2 border-gold rounded-full flex items-center justify-center mx-auto mb-6 text-gold text-2xl font-bold">
        ✓
      </div>

      <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-gold-dark font-bold mb-2">
        ORDER CONFIRMED
      </p>

      <h1 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal mb-4">
        Thank You, {name}!
      </h1>

      <p className="font-serif text-sm text-charcoal/80 mb-6 leading-relaxed">
        Your jewellery order has been received and is being prepared with our signature care and insurance. A confirmation email and tracking updates will be sent shortly.
      </p>

      <div className="bg-cream/60 border border-cream-dark p-4 mb-8 text-xs font-sans text-charcoal">
        <span className="text-charcoal-light uppercase tracking-wider block mb-1">Order Reference Number:</span>
        <span className="font-mono font-bold text-sm text-charcoal">{orderId}</span>
      </div>

      <div className="space-y-3 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center">
        <Link
          href="/shop"
          className="bg-[#111111] text-white px-8 py-3.5 font-sans text-xs uppercase tracking-widest font-semibold hover:bg-gold hover:text-black transition-colors"
        >
          Explore More Jewellery
        </Link>
        <Link
          href="/"
          className="border border-cream-dark bg-cream text-charcoal px-8 py-3.5 font-sans text-xs uppercase tracking-widest font-semibold hover:border-gold transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <div className="bg-cream min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center font-sans text-sm">Loading order details...</div>}>
        <OrderConfirmationContent />
      </Suspense>
    </div>
  );
}
