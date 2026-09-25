"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { billingFetch } from "@/lib/billing-api";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { INDIA_STATES } from "@/lib/state-codes";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";



export default function BillingSettingsPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);

  const [form, setForm] = useState({
    business_name: "Tirupati Jewellers",
    legal_name: "Tirupati Jewellers",
    business_address: "",
    city: "",
    state: "Delhi",
    state_code: "07",
    pin_code: "",
    gstin: "",
    pan: "",
    phone: "",
    email: "",
    website: "",
    invoice_prefix: "TJ/",
    financial_year: "2026-27",
    terms_conditions: "1. Goods once sold will not be returned without original invoice.\n2. Subject to local jurisdiction.\n3. All disputes subject to local court jurisdiction.",
    authorized_signatory: "",
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await billingFetch(`/admin/billing/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setForm(prev => ({ ...prev, ...data.settings }));
        }

        setBackendOnline(true);
      }
    } catch {
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = (stateName: string) => {
    const found = INDIA_STATES.find(s => s.name === stateName);
    setForm(prev => ({
      ...prev,
      state: stateName,
      state_code: found?.code || prev.state_code,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate GSTIN format if provided
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin)) {
      setError("Invalid GSTIN format. Should be like: 07AAAAA0000A1Z5");
      return;
    }

    setSaving(true);
    try {
      const res = await billingFetch(`/admin/billing/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to save settings.");
      }
    } catch {
      setError("Cannot connect to Medusa backend. Please ensure it is running on port 9000.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xs">
        Loading settings...
      </div>
    );
  }

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
              BILLING SETTINGS / GST CONFIGURATION
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/billing" className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider">
            ← Back to Billing
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-xs">

        {/* Backend offline warning */}
        {!backendOnline && (
          <div className="mb-6 p-4 bg-red-950/80 border border-red-500/60 text-red-200 text-xs">
            ⚠️ <strong>Medusa backend is offline.</strong> Settings cannot be saved to the database until the backend is running on port 9000. Run <code className="bg-red-900/50 px-1">npm run dev</code> in <code className="bg-red-900/50 px-1">backend/apps/backend</code>.
          </div>
        )}

        {saved && (
          <div className="mb-6 p-4 bg-green-950/80 border border-green-500/60 text-green-200 text-xs">
            ✓ Settings saved successfully.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-950/80 border border-red-500/60 text-red-200 text-xs">
            ✕ {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">

          {/* Business Identity */}
          <section className="bg-[#111111] border border-white/10 p-6 shadow-2xl">
            <h2 className="font-display text-xl text-white mb-6 pb-4 border-b border-white/10">
              Business Identity
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Business / Trade Name *" required>
                <input type="text" required value={form.business_name || ""} onChange={e => setForm({...form, business_name: e.target.value})} className={inputClass} />
              </Field>
              <Field label="Legal Name (as per GST)">
                <input type="text" value={form.legal_name || ""} onChange={e => setForm({...form, legal_name: e.target.value})} className={inputClass} />
              </Field>
              <Field label="Business Address" span2>
                <input type="text" value={form.business_address || ""} onChange={e => setForm({...form, business_address: e.target.value})} className={inputClass} placeholder="House/Shop No, Street, Area" />
              </Field>
              <Field label="City">
                <input type="text" value={form.city || ""} onChange={e => setForm({...form, city: e.target.value})} className={inputClass} />
              </Field>
              <Field label="State">
                <select value={form.state || ""} onChange={e => handleStateChange(e.target.value)} className={inputClass}>
                  {INDIA_STATES.map(s => (
                    <option key={s.code} value={s.name}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </Field>
              <Field label="State Code (auto-filled)">
                <input type="text" readOnly value={form.state_code || ""} className={inputClass + " opacity-60 cursor-not-allowed"} />
              </Field>
              <Field label="PIN Code">
                <input type="text" maxLength={6} value={form.pin_code || ""} onChange={e => setForm({...form, pin_code: e.target.value.replace(/\D/g, "")})} className={inputClass} />
              </Field>
            </div>
          </section>

          {/* GST & Tax Details */}
          <section className="bg-[#111111] border border-white/10 p-6 shadow-2xl">
            <h2 className="font-display text-xl text-white mb-6 pb-4 border-b border-white/10">
              GST & Tax Details
            </h2>
            <div className="p-4 mb-5 bg-amber-950/40 border border-amber-600/40 text-amber-200 text-[11px] leading-relaxed">
              <strong>⚠️ GST Compliance Note:</strong> This system generates Tax Invoices in GST-compliant format.
              It does <strong>NOT</strong> register invoices with GSTN or generate an IRN (e-invoice). If your
              annual turnover exceeds ₹5 crore, e-invoicing under IRP may be legally required and requires a
              separate IRP API integration.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="GSTIN" span2>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="07AAAAA0000A1Z5"
                  value={form.gstin || ""}
                  onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})}
                  className={inputClass + " uppercase tracking-widest font-mono"}
                />
                {form.gstin && form.gstin.length !== 15 && (
                  <p className="text-amber-400 mt-1 text-[10px]">GSTIN must be exactly 15 characters</p>
                )}
              </Field>
              <Field label="PAN">
                <input type="text" maxLength={10} placeholder="AAAAA0000A" value={form.pan || ""} onChange={e => setForm({...form, pan: e.target.value.toUpperCase()})} className={inputClass + " uppercase font-mono"} />
              </Field>
            </div>
          </section>

          {/* Contact Details */}
          <section className="bg-[#111111] border border-white/10 p-6 shadow-2xl">
            <h2 className="font-display text-xl text-white mb-6 pb-4 border-b border-white/10">
              Contact Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Phone">
                <input type="tel" value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} className={inputClass} placeholder="+91 94310 02445" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} className={inputClass} />
              </Field>
              <Field label="Website">
                <input type="url" value={form.website || ""} onChange={e => setForm({...form, website: e.target.value})} className={inputClass} placeholder="https://tirupatijewellers.com" />
              </Field>
            </div>
          </section>

          {/* Invoice Settings */}
          <section className="bg-[#111111] border border-white/10 p-6 shadow-2xl">
            <h2 className="font-display text-xl text-white mb-6 pb-4 border-b border-white/10">
              Invoice Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Invoice Prefix">
                <input type="text" value={form.invoice_prefix || ""} onChange={e => setForm({...form, invoice_prefix: e.target.value})} className={inputClass} placeholder="TJ/" />
                <p className="text-white/40 mt-1 text-[10px]">
                  Preview: {form.invoice_prefix}{form.financial_year}/000001
                </p>
              </Field>
              <Field label="Financial Year">
                <input type="text" value={form.financial_year || ""} onChange={e => setForm({...form, financial_year: e.target.value})} className={inputClass} placeholder="2026-27" />
                <p className="text-white/40 mt-1 text-[10px]">
                  Format: YYYY-YY (e.g., 2026-27). Auto-updates on April 1st.
                </p>
              </Field>
              <Field label="Authorized Signatory Name" span2>
                <input type="text" value={form.authorized_signatory || ""} onChange={e => setForm({...form, authorized_signatory: e.target.value})} className={inputClass} placeholder="e.g. Mr. Arjun Kumar" />
              </Field>
              <Field label="Terms & Conditions" span2>
                <textarea
                  rows={5}
                  value={form.terms_conditions || ""}
                  onChange={e => setForm({...form, terms_conditions: e.target.value})}
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* E-Invoice Settings (FUTURE) */}
          <section className="bg-[#111111] border border-white/10 p-6 shadow-2xl opacity-70">
            <h2 className="font-display text-xl text-white mb-6 pb-4 border-b border-white/10">
              E-Invoice / IRN Integration
            </h2>
            <div className="mb-4">
              <span className="text-gray-400 font-bold tracking-widest uppercase border border-gray-600 px-3 py-1">
                STATUS: NOT ENABLED
              </span>
            </div>
            <p className="text-gray-500 text-[11px] mb-6">
              E-invoice/IRN integration is currently disabled. This integration can be enabled in the future when e-invoicing becomes legally applicable to the business. Normal GST offline billing will continue to work perfectly without this.
            </p>
            <div className="grid grid-cols-1 gap-5 text-[11px] leading-relaxed">
              <div className="flex gap-4 border-b border-white/5 pb-2">
                <div className="w-1/3 text-white/50 uppercase tracking-widest font-bold">Provider</div>
                <div className="w-2/3 text-gray-500">Not configured</div>
              </div>
              <div className="flex gap-4 border-b border-white/5 pb-2">
                <div className="w-1/3 text-white/50 uppercase tracking-widest font-bold">Environment</div>
                <div className="w-2/3 text-gray-500">Not configured</div>
              </div>
              <div className="flex gap-4 pb-2">
                <div className="w-1/3 text-white/50 uppercase tracking-widest font-bold">Integration</div>
                <div className="w-2/3 text-gray-500">Disabled</div>
              </div>
            </div>
          </section>

          {/* Save */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/billing" className="px-8 py-3 border border-white/20 text-white/70 hover:text-white uppercase tracking-wider font-bold">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !backendOnline}
              className="px-10 py-3 bg-gold hover:bg-gold-light text-[#070707] uppercase tracking-widest font-bold transition-colors disabled:opacity-50 shadow-xl"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}

// Utility components
const inputClass = "w-full bg-[#181818] border border-white/20 p-2.5 text-white focus:border-gold outline-none text-xs";

function Field({ label, children, span2, required }: {
  label: string;
  children: React.ReactNode;
  span2?: boolean;
  required?: boolean;
}) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block text-gold-light font-semibold mb-1 uppercase tracking-wider text-[10px]">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
