"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { medusa } from "@/lib/medusa";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import SmartCoupons from "@/components/SmartCoupons";
import { trackActivity } from "@/lib/activity";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
    paymentMethod: "cod",
  });

  React.useEffect(() => {
    trackActivity({
      event_type: "CHECKOUT_STARTED",
      metadata: { cart_id: cart?.id },
    });
  }, [cart?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || !cart.id) return;

    setSubmitting(true);
    try {
      // Update cart shipping address & email in Medusa
      try {
        await medusa.store.cart.update(cart.id, {
          email: formData.email,
          shipping_address: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            address_1: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
            province: formData.province,
            country_code: "in",
            phone: formData.phone,
          },
        });
      } catch (err) {
        console.warn("Notice updating cart metadata:", err);
      }

      // Add default shipping method so payment collection can be initiated
      try {
        const fulfillmentRes = await (medusa.store as any).fulfillment.listCartOptions({ cart_id: cart.id });
        const options = fulfillmentRes.shipping_options || [];
        if (options.length > 0) {
          await medusa.store.cart.addShippingMethod(cart.id, { option_id: options[0].id });
        }
      } catch (err) {
        console.warn("Notice adding shipping method:", err);
      }

      const items = cart?.items || [];
      const subtotal = cart?.subtotal ?? items.reduce((sum: number, item: any) => sum + (item.unit_price || 0) * item.quantity, 0);
      const discountTotal = cart?.discount_total ?? 0;
      const grandTotal = cart?.total ?? (subtotal - discountTotal);

      if (formData.paymentMethod === "online") {
        let orderId = "";
        try {
          await medusa.store.payment.initiatePaymentSession(cart, { provider_id: "razorpay" });
          orderId = "order_" + Date.now(); 
        } catch (err) {
          orderId = "order_dummy123";
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummykey",
          amount: Math.round(grandTotal * 100),
          currency: cart.currency_code?.toUpperCase() || "INR",
          name: "Tirupati Jewellers",
          description: "Fine Jewellery Purchase",
          order_id: orderId,
          handler: async function (response: any) {
            try {
              // Verify on backend
              const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
              const verifyRes = await fetch(`${baseUrl}/store/razorpay/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response)
              });
              
              if (!verifyRes.ok) throw new Error("Payment verification failed");
              
              // Proceed to complete cart
              let finalOrderId = cart.id;
              try {
                const completeRes = await medusa.store.cart.complete(cart.id);
                if (completeRes && completeRes.type === "order" && completeRes.order) {
                  finalOrderId = completeRes.order.id;
                }
              } catch (err) {
                console.error("Cart completion failed after Razorpay verify", err);
              }
              localStorage.removeItem("medusa_cart_id");
              trackActivity({
                event_type: "ORDER_PLACED",
                metadata: { order_id: finalOrderId, payment_method: "online" }
              });
              router.push(`/order-confirmation?order_id=${finalOrderId}&name=${encodeURIComponent(formData.firstName)}`);
            } catch (err) {
              alert("Payment verification failed. Please contact support.");
              setSubmitting(false);
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone,
          },
          theme: { color: "#0a0a0a" },
          modal: { ondismiss: function() { setSubmitting(false); } }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return; // wait for razorpay callback
      }

      // COD Flow
      try {
        await medusa.store.payment.initiatePaymentSession(cart, { provider_id: "pp_system_default" });
      } catch (err) {
        console.warn("Failed to initiate COD session", err);
      }
      
      let finalOrderId = cart.id;
      try {
        const completeRes = await medusa.store.cart.complete(cart.id);
        if (completeRes && completeRes.type === "order" && completeRes.order) {
          finalOrderId = completeRes.order.id;
        }
      } catch (err) {
        console.error("Cart completion failed for COD", err);
      }

      localStorage.removeItem("medusa_cart_id");
      trackActivity({
        event_type: "ORDER_PLACED",
        metadata: { order_id: finalOrderId, payment_method: "cod" }
      });
      router.push(`/order-confirmation?order_id=${finalOrderId}&name=${encodeURIComponent(formData.firstName)}`);
    } catch (error) {
      console.error("Error completing checkout:", error);
      alert("There was an issue processing your order. Please try again.");
      setSubmitting(false);
    }
  };

  const items = cart?.items || [];
  const subtotal = cart?.subtotal ?? items.reduce(
    (sum: number, item: any) => sum + (item.unit_price || 0) * item.quantity,
    0
  );
  const discountTotal = cart?.discount_total ?? 0;
  const grandTotal = cart?.total ?? (subtotal - discountTotal);

  const multiplier = cart?.currency_code?.toLowerCase() === "eur" ? 8900 : (cart?.currency_code?.toLowerCase() === "usd" ? 8500 : 1);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount * multiplier);
  };

  const shippingTotal = cart?.shipping_total ?? 0;
  const formattedSubtotal = formatCurrency(subtotal);
  const formattedDiscount = formatCurrency(discountTotal);
  const formattedShipping = formatCurrency(shippingTotal);
  const formattedTotal = formatCurrency(grandTotal);

  if (loading && !cart) {
    return (
      <div className="min-h-[60vh] bg-cream flex items-center justify-center font-sans text-sm text-charcoal-light">
        Preparing checkout...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-cream py-16 px-4 flex flex-col items-center justify-center text-center">
        <h2 className="font-serif text-2xl text-charcoal mb-4">Your cart is empty</h2>
        <p className="font-sans text-xs text-charcoal-light mb-6">Please add items to your cart before proceeding to checkout.</p>
        <Link href="/shop" className="bg-[#111111] text-white px-8 py-3 text-xs uppercase font-sans font-semibold">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-gold-dark font-bold mb-2">
            SECURE TRANSACTION
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal">
            Checkout Details
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Billing & Shipping Form */}
          <div className="lg:col-span-2 bg-white border border-cream-dark p-8 sm:p-12 space-y-8">
            
            {/* Contact */}
            <div>
              <h2 className="font-serif text-xl text-charcoal mb-4 pb-2 border-b border-cream-dark">
                1. Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
                <div>
                  <label className="block text-charcoal font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-charcoal font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h2 className="font-serif text-xl text-charcoal mb-4 pb-2 border-b border-cream-dark">
                2. Shipping Address
              </h2>
              <div className="space-y-4 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-charcoal font-semibold mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-charcoal font-semibold mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-charcoal font-semibold mb-1">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House / Flat No., Street, Landmark"
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-charcoal font-semibold mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-charcoal font-semibold mb-1">State *</label>
                    <input
                      type="text"
                      name="province"
                      required
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-charcoal font-semibold mb-1">PIN Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h2 className="font-serif text-xl text-charcoal mb-4 pb-2 border-b border-cream-dark">
                3. Payment Method
              </h2>
              <div className="space-y-3 font-sans text-xs">
                <label className="flex items-center gap-3 p-4 border border-cream-dark cursor-pointer hover:border-gold bg-cream/30">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === "cod"}
                    onChange={handleChange}
                    className="text-gold focus:ring-gold"
                  />
                  <div>
                    <span className="font-semibold text-charcoal">Cash on Delivery (Verified Jewellery Courier)</span>
                    <p className="text-charcoal-light text-[11px] mt-0.5">Pay upon secure inspection and delivery.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-cream-dark cursor-pointer hover:border-gold bg-cream/30">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={formData.paymentMethod === "online"}
                    onChange={handleChange}
                    className="text-gold focus:ring-gold"
                  />
                  <div>
                    <span className="font-semibold text-charcoal">Online Payment (UPI / NetBanking / Cards)</span>
                    <p className="text-charcoal-light text-[11px] mt-0.5">Instant secure payment gateway with SSL encryption.</p>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Order Summary in Checkout */}
          <div className="bg-white border border-cream-dark p-8">
            <h2 className="font-serif text-xl text-charcoal mb-6 pb-4 border-b border-cream-dark">
              Order Summary
            </h2>

            <div className="divide-y divide-cream-dark mb-6 max-h-60 overflow-y-auto">
              {items.map((item: any) => {
                let displayTitle = item.title;


                return (
                  <div key={item.id} className="py-3 flex justify-between items-center text-xs font-sans">
                    <div>
                      <p className="font-semibold text-charcoal">{displayTitle}</p>
                      <p className="text-charcoal-light">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium text-charcoal">
                      {item.unit_price === undefined || item.unit_price === null ? "Price Unavailable" : formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Smart Coupons & Available Offers Section */}
            <div className="my-6 pt-4 border-t border-cream-dark">
              <SmartCoupons />
            </div>

            <div className="space-y-3 font-sans text-xs text-charcoal/80 mb-6 pt-4 border-t border-cream-dark">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-charcoal">{formattedSubtotal}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-gold-dark">
                  <span>Discount</span>
                  <span className="font-semibold">-{formattedDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Insured Delivery</span>
                {shippingTotal === 0 ? (
                  <span className="text-green-700 font-semibold">FREE</span>
                ) : (
                  <span className="font-semibold text-charcoal">{formattedShipping}</span>
                )}
              </div>
              <div className="border-t border-cream-dark pt-3 flex justify-between text-base font-serif text-charcoal font-semibold">
                <span>Total Amount</span>
                <span className="text-gold-dark">{formattedTotal}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#111111] text-white py-4 font-sans text-xs uppercase tracking-widest font-semibold hover:bg-gold hover:text-black transition-colors disabled:opacity-50"
            >
              {submitting ? "PLACING ORDER..." : "COMPLETE ORDER"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
