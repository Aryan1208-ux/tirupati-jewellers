"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAdminProducts } from "@/lib/admin-products";
import { billingFetch } from "@/lib/billing-api";
import { isAdminAuthenticated, getAdminUser, logoutAdmin } from "@/lib/admin-auth";
import { INDIA_STATES } from "@/lib/state-codes";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

interface LineItem {
  product_id: string | null;
  product_name: string;
  sku: string;
  hsn: string;
  quantity: number;
  gross_weight: string;
  net_weight: string;
  purity: string;
  rate: number;
  discount: number;
  gst_rate: number;
  isCustom?: boolean;
  is_tax_inclusive?: boolean;
}

export default function CreateEstimatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const submitLock = useRef(false); // prevent double-submit

  const [customerType, setCustomerType] = useState<"b2c" | "b2b">("b2c");
  const [customerInfo, setCustomerInfo] = useState({
    name: "", mobile: "", address: "", city: "",
    state: "", state_code: "", pin: "", gstin: ""
  });
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    fetchSettings();
    fetchAdminProducts().then((prods) => {
      if (prods && prods.length > 0) {
        setProducts(prods);
      }
    });
  }, [router]);

  const fetchSettings = async () => {
    try {
      const res = await billingFetch(`/admin/billing/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setCustomerInfo(prev => ({
          ...prev,
          state_code: "",
          state: "",
        }));
        setBackendOnline(true);
      }
    } catch {
      setBackendOnline(false);
      setSettings({ invoice_prefix: "TJ/", financial_year: "2026-27" });
    }
  };

  const addProductItem = useCallback((product: any) => {
    const jMeta = product.jewellery || {};
    const newItem: LineItem = {
      product_id: product.id,
      product_name: product.title,
      sku: product.handle || "",
      hsn: jMeta.hsn_sac || "",
      quantity: 1,
      gross_weight: jMeta.gross_weight_g ? String(jMeta.gross_weight_g) : (product.goldWeight || ""),
      net_weight: jMeta.net_weight_g ? String(jMeta.net_weight_g) : (jMeta.gross_weight_g ? String(jMeta.gross_weight_g) : (product.goldWeight || "")),
      purity: jMeta.purity || product.purity || "",
      rate: product.price || 0,
      discount: 0,
      gst_rate: 3, // default for jewellery, adjustable per line
      is_tax_inclusive: true, // catalog products are tax inclusive
    };
    setItems(prev => [...prev, newItem]);
    setSearchQuery("");
    setShowDropdown(false);
  }, []);

  const addCustomItem = () => {
    const newItem: LineItem = {
      product_id: null,
      product_name: "",
      sku: "",
      hsn: "",
      quantity: 1,
      gross_weight: "",
      net_weight: "",
      purity: "",
      rate: 0,
      discount: 0,
      gst_rate: 3,
      isCustom: true,
      is_tax_inclusive: true,
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // ── Server-mirroring GST calculation (displayed on frontend; server recalculates on submit) ──
  const totals = useMemo(() => {
    const isIntraState = customerInfo.state_code === settings?.state_code;
    let subtotal = 0, totalDiscount = 0, taxable_amount = 0, cgst = 0, sgst = 0, igst = 0;

    items.forEach(item => {
      const lineSubtotal = Number(item.rate) * Number(item.quantity);
      const lineDiscount = Math.min(Number(item.discount || 0), lineSubtotal);
      
      let lineTaxable = 0;
      let lineGst = 0;
      if (item.is_tax_inclusive) {
        const finalAmountAfterDiscount = lineSubtotal - lineDiscount;
        lineTaxable = finalAmountAfterDiscount / (1 + (Number(item.gst_rate) / 100));
        lineGst = finalAmountAfterDiscount - lineTaxable;
      } else {
        lineTaxable = lineSubtotal - lineDiscount;
        lineGst = lineTaxable * (Number(item.gst_rate) / 100);
      }

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;
      taxable_amount += lineTaxable;
      if (isIntraState) {
        cgst += lineGst / 2;
        sgst += lineGst / 2;
      } else {
        igst += lineGst;
      }
    });

    const raw = taxable_amount + cgst + sgst + igst;
    const grand_total = Math.round(raw);
    const round_off = grand_total - raw;
    return { subtotal, totalDiscount, taxable_amount, cgst, sgst, igst, round_off, grand_total };
  }, [items, customerInfo.state_code, settings]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (items.length === 0) errs.items = "Please add at least one product.";
    if (!customerInfo.name.trim()) errs.name = "Customer name is required.";
    if (!validUntil) errs.validUntil = "Please specify validity date.";
    if (customerType === "b2b" && (!customerInfo.gstin || customerInfo.gstin.length !== 15)) {
      errs.gstin = "Valid 15-character GSTIN required for B2B.";
    }
    if (customerInfo.state_code && !INDIA_STATES.find(s => s.code === customerInfo.state_code)) {
      errs.state_code = "Invalid State Code.";
    }
    const missingHsn = items.filter(it => !it.hsn?.trim());
    if (missingHsn.length > 0) {
      errs.hsn = `HSN code is missing for ${missingHsn.length} item(s). Please fill before generating.`;
    }
    const invalidItems = items.filter(it => !it.product_name?.trim() || it.rate <= 0);
    if (invalidItems.length > 0) {
      errs.items = "All items must have a product name and a valid rate > 0.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return; // prevent double-click
    if (!validate()) return;

    submitLock.current = true;
    setLoading(true);

    try {
      if (!backendOnline) {
        throw new Error("Medusa backend is offline. Cannot generate invoice.");
      }

      const payload = {
        customer_type: customerType,
        customer_name: customerInfo.name.trim(),
        mobile_number: customerInfo.mobile || null,
        address: customerInfo.address || null,
        city: customerInfo.city || null,
        state: customerInfo.state || null,
        state_code: customerInfo.state_code || null,
        pin_code: customerInfo.pin || null,
        
        gstin: customerInfo.gstin || null,
        valid_until: validUntil || undefined,
        notes: "Estimate generated",

        
        
        
        
        items: items.map(it => ({
          product_id: it.product_id,
          product_name: it.product_name,
          sku: it.sku,
          hsn: it.hsn,
          quantity: it.quantity,
          gross_weight: it.gross_weight,
          net_weight: it.net_weight,
          purity: it.purity,
          rate: it.rate,
          discount: it.discount,
          gst_rate: it.gst_rate,
          is_tax_inclusive: it.is_tax_inclusive ?? true,
        })),
      };

      const res = await billingFetch(`/admin/billing/estimates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/billing/estimates/${data.estimate.id}`);
      } else {
        if (res.status === 401) {
          setErrors({ submit: "Session expired. Redirecting to login..." });
          setTimeout(() => {
            logoutAdmin();
          }, 1500);
          return;
        }
        const err = await res.json();
        setErrors({ submit: err.error || "Failed to generate invoice." });
        submitLock.current = false;
      }
    } catch (err: any) {
      setErrors({ submit: err.message || "Server connection failed." });
      submitLock.current = false;
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = searchQuery.length >= 2
    ? products.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.handle || "").toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
  const fmtCur = (n: number) => `₹${fmt(n)}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111111] border-b border-gold/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold">👑</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">
              TIRUPATI JEWELLERS
            </h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">
              CREATE NEW ESTIMATE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!backendOnline && (
            <span className="text-[10px] text-red-400 border border-red-700/50 px-2 py-1 bg-red-950/30">
              ⚠ Backend Offline
            </span>
          )}
          <Link href="/admin/billing" className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider">
            ← Cancel
          </Link>
        </div>
      </header>

      {!backendOnline && (
        <div className="bg-red-950/60 border-b border-red-700/50 px-4 sm:px-8 py-3 text-red-200 text-xs">
          <strong>⚠ Medusa backend is offline.</strong> Invoices cannot be saved. Start the backend with{" "}
          <code className="bg-red-900/50 px-1">npm run dev</code> in <code className="bg-red-900/50 px-1">backend/apps/backend</code>.
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans text-xs">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── Left Column ───────────────────────────────────────────── */}
            <div className="lg:col-span-8 space-y-6">

              {/* Customer Details */}
              <section className="bg-[#111111] border border-white/10 p-6 shadow-xl">
                <div className="flex flex-wrap justify-between items-center mb-5 pb-4 border-b border-white/10 gap-3">
                  <h2 className="font-display text-xl text-white">Customer Details</h2>
                  <div className="flex gap-5">
                    {(["b2c", "b2b"] as const).map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={customerType === type}
                          onChange={() => {
                            setCustomerType(type);
                            if (type === "b2c") setCustomerInfo(prev => ({ ...prev, gstin: "" }));
                          }}
                          className="accent-gold"
                        />
                        <span className="uppercase tracking-widest text-[10px] font-bold text-white/80">
                          {type === "b2c" ? "B2C (Unregistered)" : "B2B (GST Registered)"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormField label="Valid Until" error={errors.validUntil}>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={e => {
                        setValidUntil(e.target.value);
                        setErrors(prev => ({ ...prev, validUntil: "" }));
                      }}
                      className={`${inp} ${errors.validUntil ? "border-red-500" : ""}`}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Customer Name" error={errors.name}>
                    <div className="relative">
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={e => {
                          setCustomerInfo({ ...customerInfo, name: e.target.value });
                          setErrors(prev => ({ ...prev, name: "" }));
                        }}
                        placeholder="Enter Name..."
                        className={`${inp} ${errors.name ? "border-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerInfo(prev => ({ ...prev, name: "Walk-in Customer" }));
                          setErrors(prev => ({ ...prev, name: "" }));
                        }}
                        className="absolute right-2 top-2 bg-[#222] hover:bg-[#333] border border-white/20 text-white/70 px-2 py-0.5 text-[9px] uppercase tracking-wider transition-colors"
                      >
                        Walk-in
                      </button>
                    </div>
                  </FormField>
                  <FormField label="Mobile Number">
                    <input
                      type="tel"
                      maxLength={13}
                      value={customerInfo.mobile}
                      onChange={e => setCustomerInfo({ ...customerInfo, mobile: e.target.value.replace(/[^0-9+]/g, "") })}
                      className={inp}
                      placeholder="+91 98765 43210"
                    />
                  </FormField>

                  {customerType === "b2b" && (
                    <div className="sm:col-span-2">
                      <FormField label="GSTIN *" error={errors.gstin}>
                        <input
                          type="text"
                          maxLength={15}
                          placeholder="07AAAAA0000A1Z5"
                          value={customerInfo.gstin}
                          onChange={e => {
                            setCustomerInfo({ ...customerInfo, gstin: e.target.value.toUpperCase() });
                            setErrors(prev => ({ ...prev, gstin: "" }));
                          }}
                          className={`${inp} uppercase tracking-[0.2em] font-mono ${errors.gstin ? "border-red-500" : ""}`}
                        />
                        {customerInfo.gstin && customerInfo.gstin.length !== 15 && (
                          <p className="text-amber-400 mt-1 text-[10px]">Must be 15 characters — currently {customerInfo.gstin.length}</p>
                        )}
                      </FormField>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <FormField label="Address">
                      <input
                        type="text"
                        value={customerInfo.address}
                        onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        className={inp}
                        placeholder="House No, Street, Locality"
                      />
                    </FormField>
                  </div>

                  <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField label="City">
                      <input type="text" value={customerInfo.city} onChange={e => setCustomerInfo({ ...customerInfo, city: e.target.value })} className={inp} />
                    </FormField>
                    <FormField label="State">
                      <input type="text" value={customerInfo.state} onChange={e => setCustomerInfo({ ...customerInfo, state: e.target.value })} className={inp} placeholder="e.g. Delhi" />
                    </FormField>
                    <FormField label="State Code" error={errors.state_code}>
                      <select
                        value={customerInfo.state_code}
                        onChange={e => {
                          const code = e.target.value;
                          const st = INDIA_STATES.find(s => s.code === code);
                          setCustomerInfo({ ...customerInfo, state_code: code, state: st ? st.name : customerInfo.state });
                          setErrors(prev => ({ ...prev, state_code: "" }));
                        }}
                        className={`${inp} ${errors.state_code ? "border-red-500" : ""}`}
                      >
                        <option value="">Select State</option>
                        {INDIA_STATES.map(s => (
                          <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                        ))}
                      </select>
                      {customerInfo.state_code === settings?.state_code && (
                        <p className="text-emerald-400 text-[9px] mt-0.5">→ CGST + SGST (Intra-state)</p>
                      )}
                      {customerInfo.state_code && customerInfo.state_code !== settings?.state_code && (
                        <p className="text-blue-400 text-[9px] mt-0.5">→ IGST (Inter-state)</p>
                      )}
                    </FormField>
                    <FormField label="PIN Code">
                      <input type="text" maxLength={6} value={customerInfo.pin} onChange={e => setCustomerInfo({ ...customerInfo, pin: e.target.value.replace(/\D/g, "") })} className={inp} />
                    </FormField>
                  </div>
                </div>
              </section>

              {/* Line Items */}
              <section className="bg-[#111111] border border-white/10 p-6 shadow-xl">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/10">
                  <h2 className="font-display text-xl text-white">Line Items</h2>
                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="border border-gold/40 text-gold hover:bg-gold/10 px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-colors"
                  >
                    + Add Custom Item
                  </button>
                </div>

                {/* Product Search */}
                <div className="relative mb-5">
                  <input
                    type="text"
                    placeholder="🔍  Search product by name or SKU (min. 2 chars)..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="w-full bg-[#181818] border border-gold/40 p-3 text-white focus:border-gold outline-none text-sm placeholder:text-white/30"
                  />
                  {showDropdown && filteredProducts.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-[#161616] border border-white/20 shadow-2xl max-h-64 overflow-y-auto">
                      {filteredProducts.map(p => (
                        <div
                          key={p.id}
                          onMouseDown={() => addProductItem(p)}
                          className="p-3 hover:bg-gold/10 cursor-pointer flex justify-between items-center border-b border-white/5"
                        >
                          <div>
                            <p className="font-bold text-white">{p.title}</p>
                            <p className="text-[10px] text-white/50">
                              SKU: {p.handle} &nbsp;•&nbsp; {p.purity} &nbsp;•&nbsp; {p.category}
                            </p>
                          </div>
                          <p className="font-serif text-gold font-bold ml-4 shrink-0">
                            {fmtCur(p.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {showDropdown && searchQuery.length >= 2 && filteredProducts.length === 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-[#161616] border border-white/20 shadow-2xl p-4 text-white/50 text-center">
                      No products found. Use "+ Add Custom Item" above.
                    </div>
                  )}
                </div>

                {/* Error messages */}
                {errors.items && (
                  <p className="text-red-400 mb-3 text-[11px]">✕ {errors.items}</p>
                )}
                {errors.hsn && (
                  <div className="mb-3 p-3 bg-amber-950/60 border border-amber-600/40 text-amber-200 text-[11px]">
                    ⚠ {errors.hsn}
                  </div>
                )}

                {/* Items Table */}
                {items.length > 0 ? (
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-left min-w-[700px]">
                      <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[9px] border-b border-white/10">
                        <tr>
                          <th className="p-3 w-[25%]">Item / Product</th>
                          <th className="p-3 w-[8%]">HSN</th>
                          <th className="p-3 w-[6%] text-center">Qty</th>
                          <th className="p-3 w-[10%]">Weight</th>
                          <th className="p-3 w-[10%] text-right">Rate (₹)</th>
                          <th className="p-3 w-[8%] text-right">Disc. (₹)</th>
                          <th className="p-3 w-[5%] text-center" title="Tax Inclusive?">Incl.</th>
                          <th className="p-3 w-[8%] text-center">GST%</th>
                          <th className="p-3 w-[10%] text-right">Total (₹)</th>
                          <th className="p-3 w-[4%]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => {
                          const lineSubtotal = item.rate * item.quantity;
                          const lineDiscount = Math.min(item.discount || 0, lineSubtotal);
                          
                          let lineTaxable = 0;
                          let lineGst = 0;
                          if (item.is_tax_inclusive) {
                            const finalAmountAfterDiscount = lineSubtotal - lineDiscount;
                            lineTaxable = finalAmountAfterDiscount / (1 + (item.gst_rate / 100));
                            lineGst = finalAmountAfterDiscount - lineTaxable;
                          } else {
                            lineTaxable = lineSubtotal - lineDiscount;
                            lineGst = lineTaxable * (item.gst_rate / 100);
                          }
                          const lineTotal = lineTaxable + lineGst;
                          const hsnMissing = !item.hsn?.trim();
                          return (
                            <tr key={idx} className={`border-b border-white/5 hover:bg-[#161616] ${hsnMissing ? "bg-amber-950/10" : ""}`}>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={item.product_name}
                                  onChange={e => updateItem(idx, "product_name", e.target.value)}
                                  placeholder="Product name..."
                                  className="bg-transparent border-b border-white/20 w-full focus:border-gold outline-none pb-0.5"
                                />
                                {item.purity && <p className="text-[9px] text-white/40 mt-1">{item.purity}</p>}
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={item.hsn}
                                  onChange={e => updateItem(idx, "hsn", e.target.value)}
                                  placeholder="HSN"
                                  className={`bg-transparent border-b w-full focus:border-gold outline-none text-center ${hsnMissing ? "border-amber-500/60" : "border-white/20"}`}
                                />
                                {hsnMissing && (
                                  <p className="text-amber-400 text-[8px] mt-0.5 text-center">Required</p>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={e => updateItem(idx, "quantity", Math.max(1, Number(e.target.value)))}
                                  className="bg-transparent border-b border-white/20 w-10 focus:border-gold outline-none text-center"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="text"
                                  value={item.net_weight}
                                  onChange={e => updateItem(idx, "net_weight", e.target.value)}
                                  placeholder="e.g. 12g"
                                  className="bg-transparent border-b border-white/20 w-full focus:border-gold outline-none text-center"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.rate}
                                  onChange={e => updateItem(idx, "rate", Number(e.target.value))}
                                  className="bg-transparent border-b border-white/20 w-full focus:border-gold outline-none text-right"
                                />
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={lineSubtotal}
                                  value={item.discount}
                                  onChange={e => updateItem(idx, "discount", Math.min(Number(e.target.value), lineSubtotal))}
                                  className="bg-transparent border-b border-white/20 w-full focus:border-gold outline-none text-right"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.is_tax_inclusive ?? true}
                                  onChange={e => updateItem(idx, "is_tax_inclusive", e.target.checked)}
                                  className="accent-gold w-4 h-4"
                                />
                              </td>
                              <td className="p-3">
                                <select
                                  value={item.gst_rate}
                                  onChange={e => updateItem(idx, "gst_rate", Number(e.target.value))}
                                  className="bg-[#1e1e1e] border border-white/20 focus:border-gold outline-none text-center w-full py-0.5"
                                >
                                  {[0, 1.5, 3, 5, 12, 18, 28].map(r => (
                                    <option key={r} value={r}>{r}%</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3 text-right font-serif text-sm font-bold text-white">
                                {fmt(lineTotal)}
                              </td>
                              <td className="p-3 text-center">
                                <button type="button" onClick={() => removeItem(idx)} className="text-red-500/70 hover:text-red-400 text-lg leading-none">
                                  ×
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center border border-dashed border-white/10 text-white/40">
                    <p className="mb-2 text-2xl">🔍</p>
                    <p>Search for a product above or use "+ Add Custom Item"</p>
                  </div>
                )}
              </section>

            </div>

            {/* ── Right Column: Summary & Submit ──────────────────────────── */}
            <div className="lg:col-span-4">
              <div className="bg-[#111111] border border-white/10 shadow-xl sticky top-6">

                {/* Totals */}
                <div className="p-6 border-b border-white/10">
                  <h2 className="font-display text-xl text-white mb-5">Bill Summary</h2>
                  <div className="space-y-3 font-mono text-sm">
                    <TotalRow label="Subtotal" value={fmtCur(totals.subtotal)} />
                    {totals.totalDiscount > 0 && (
                      <TotalRow label="Discount" value={`-${fmtCur(totals.totalDiscount)}`} dim />
                    )}
                    <div className="border-t border-white/10 pt-2">
                      <TotalRow label="Taxable Value" value={fmtCur(totals.taxable_amount)} bold />
                    </div>
                    {customerInfo.state_code === settings?.state_code ? (
                      <>
                        <TotalRow label="CGST" value={fmtCur(totals.cgst)} gold />
                        <TotalRow label="SGST" value={fmtCur(totals.sgst)} gold />
                      </>
                    ) : (
                      <TotalRow label="IGST" value={fmtCur(totals.igst)} gold />
                    )}
                    <div className="border-t border-white/10 pt-2">
                      <TotalRow label="Round Off" value={(totals.round_off >= 0 ? "+" : "") + fmtCur(totals.round_off)} dim />
                    </div>
                    <div className="border-t border-gold/30 pt-3 flex justify-between items-end">
                      <span className="font-sans text-xs uppercase tracking-widest text-gold font-bold">Grand Total</span>
                      <span className="font-serif text-3xl font-bold text-gold">{fmtCur(totals.grand_total)}</span>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="p-6">
                  {errors.submit && (
                    <p className="text-red-400 text-[11px] mb-4">✕ {errors.submit}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading || items.length === 0 || !backendOnline}
                    className="w-full bg-gold hover:bg-gold-light text-[#070707] py-4 uppercase tracking-[0.2em] font-bold transition-colors disabled:opacity-50 shadow-xl text-xs"
                  >
                    {loading ? "Generating Estimate..." : "Generate Estimate"}
                  </button>
                  <p className="text-[9px] text-white/30 mt-3 text-center uppercase tracking-widest">
                    Backend recalculates & saves atomically.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}

const inp = "w-full bg-[#181818] border border-white/20 p-2.5 text-white focus:border-gold outline-none text-xs";

function FormField({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">{label}</label>
      {children}
      {error && <p className="text-red-400 mt-1 text-[10px]">{error}</p>}
    </div>
  );
}

function TotalRow({ label, value, bold, dim, gold }: {
  label: string; value: string; bold?: boolean; dim?: boolean; gold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-white" : dim ? "text-white/40" : gold ? "text-gold-light/80" : "text-white/70"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
