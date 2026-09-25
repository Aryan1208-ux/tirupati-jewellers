"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

export default function PaymentPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (token) fetchPaymentDetails();
  }, [token]);

  const fetchPaymentDetails = async () => {
    try {
      const res = await fetch(`${MEDUSA_URL}/store/billing/pay/${token}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.payment);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to load payment link.");
      }
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    setPaying(true);
    // In a real implementation, this would redirect to Razorpay/Stripe checkout URL
    // For now, simulate gateway delay then show a success message
    setTimeout(() => {
      setPaying(false);
      alert("This is where the user would be redirected to Razorpay/Stripe.\n\nGateway integration requires provider credentials to be configured.");
    }, 1500);
  };

  const fmtCur = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center text-charcoal font-sans text-sm">Loading secure payment portal...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white p-8 max-w-md w-full text-center shadow-2xl border border-gold/20">
          <span className="text-4xl block mb-4">⚠️</span>
          <h1 className="font-display text-2xl mb-2 text-charcoal">Link Invalid or Expired</h1>
          <p className="font-sans text-sm text-charcoal-light mb-6">{error}</p>
          <p className="font-sans text-xs text-charcoal-light">Please contact the store for a new payment link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg bg-white shadow-2xl border border-gold/30">
        {/* Header */}
        <div className="bg-charcoal text-center py-8 px-6 border-b-4 border-gold">
          <h1 className="font-display text-2xl text-gold tracking-[0.2em] mb-2">{data.business_name}</h1>
          <p className="font-sans text-[10px] text-white/70 uppercase tracking-widest">Secure Payment Portal</p>
        </div>

        {/* Invoice Summary */}
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-charcoal-light mb-1 font-semibold">Bill To</p>
              <p className="font-serif text-lg font-bold text-charcoal">{data.customer_name}</p>
            </div>
            <div className="text-right">
              <p className="font-sans text-[10px] uppercase tracking-widest text-charcoal-light mb-1 font-semibold">Invoice No</p>
              <p className="font-mono text-sm font-bold text-charcoal">{data.invoice_number}</p>
            </div>
          </div>

          <div className="border-t border-b border-gray-100 py-6 mb-8 space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-sans text-charcoal-light">Total Invoice Value</span>
              <span className="font-serif font-bold text-charcoal">{fmtCur(data.grand_total)}</span>
            </div>
            {data.amount_paid > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-sans text-charcoal-light">Amount Already Paid</span>
                <span className="font-serif font-bold text-green-700">{fmtCur(data.amount_paid)}</span>
              </div>
            )}
            <div className="flex justify-between items-center bg-cream-dark p-4 border border-gold/20">
              <span className="font-sans font-bold text-charcoal uppercase tracking-wider text-xs">Amount Due</span>
              <span className="font-display text-2xl font-bold text-gold-dark">{fmtCur(data.outstanding)}</span>
            </div>
          </div>

          <div className="mb-8">
            <p className="font-sans text-[10px] uppercase tracking-widest text-charcoal-light mb-3 font-semibold border-b border-gray-100 pb-2">Items on this Invoice</p>
            <div className="space-y-3">
              {data.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-xs font-sans">
                  <span className="text-charcoal font-medium">
                    {item.quantity}x {item.product_name}
                  </span>
                  <span className="text-charcoal-light">{fmtCur(Number(item.total))}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full bg-charcoal hover:bg-black text-gold py-4 font-sans text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-50"
          >
            {paying ? "Connecting to Gateway..." : `Pay ${fmtCur(data.outstanding)} Securely`}
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
          <p className="font-sans text-[10px] text-charcoal-light mb-2">
            Payments are processed securely via SSL encryption.
          </p>
          <div className="flex justify-center gap-4 text-charcoal-light/50 grayscale opacity-70">
            {/* Mock payment method icons */}
            <span className="text-xl">💳</span>
            <span className="text-xl">🏦</span>
            <span className="text-xl">📱</span>
          </div>
        </div>
      </div>
    </div>
  );
}
