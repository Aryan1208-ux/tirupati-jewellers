"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

export default function CustomerDirectoryPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    fetchCustomers();
  }, [router]);

  const fetchCustomers = async (q?: string, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status && status !== "ALL") params.set("status", status);
      const res = await fetch(`${MEDUSA_URL}/admin/billing/customers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery, filterStatus);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchQuery, filterStatus);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filterStatus]);

  const fmtCur = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="bg-[#111111] border-b border-gold/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold">👑</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">
              TIRUPATI JEWELLERS
            </h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">
              CUSTOMER DIRECTORY
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/admin/billing" className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider">
            ← Billing Dashboard
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gold hover:bg-gold-light text-[#070707] px-4 py-1.5 text-xs uppercase tracking-widest font-bold transition-colors"
          >
            + New Customer
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-xs">

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <h2 className="font-display text-2xl font-normal text-white">All Customers</h2>
          <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search name, mobile, email, GSTIN, invoice..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#181818] border border-white/20 px-4 py-2 text-white outline-none focus:border-gold w-80"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-[#181818] border border-white/20 px-3 py-2 text-white outline-none focus:border-gold"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
              <option value="PAID">Paid</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </form>
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="text-center py-20 text-white/40">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <p className="text-3xl mb-3">👥</p>
            <p className="mb-4">No customers found.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gold hover:bg-gold-light text-[#070707] px-6 py-2 uppercase tracking-widest text-xs font-bold"
            >
              + Create First Customer
            </button>
          </div>
        ) : (
          <div className="bg-[#111111] border border-white/10 shadow-2xl overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-4 px-5">Customer</th>
                  <th className="py-4 px-5">Mobile</th>
                  <th className="py-4 px-5">Type</th>
                  <th className="py-4 px-5 text-center">Invoices</th>
                  <th className="py-4 px-5 text-right">Total Purchases</th>
                  <th className="py-4 px-5 text-right">Outstanding</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-[#161616] transition-colors">
                    <td className="py-3 px-5">
                      <p className="font-bold text-white">{c.name}</p>
                      {c.email && <p className="text-[10px] text-white/40">{c.email}</p>}
                      {c.city && <p className="text-[10px] text-white/30">{c.city}{c.state ? `, ${c.state}` : ""}</p>}
                    </td>
                    <td className="py-3 px-5 text-white/70 font-mono">{c.mobile || "—"}</td>
                    <td className="py-3 px-5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase tracking-wider ${
                        c.customer_type === "b2b"
                          ? "bg-blue-900/40 text-blue-300 border-blue-800/50"
                          : "bg-white/5 text-white/50 border-white/10"
                      }`}>
                        {c.customer_type}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center text-white/70">{c.invoice_count || 0}</td>
                    <td className="py-3 px-5 text-right font-serif text-sm text-gold font-bold">
                      {c.total_purchases > 0 ? fmtCur(c.total_purchases) : "—"}
                    </td>
                    <td className="py-3 px-5 text-right">
                      {c.outstanding > 0 ? (
                        <span className="text-amber-400 font-bold">{fmtCur(c.outstanding)}</span>
                      ) : (
                        <span className="text-green-400/60">₹0</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <CustomerStatusBadge status={c.status} />
                    </td>
                    <td className="py-3 px-5 text-center">
                      <Link
                        href={`/admin/billing/customers/${c.id}`}
                        className="text-gold-light hover:text-white underline uppercase tracking-widest text-[10px]"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-white/30 text-[10px] mt-4 text-right">
          {customers.length} customer{customers.length !== 1 ? "s" : ""} shown
        </p>
      </main>

      {/* Create Customer Modal */}
      {showCreateModal && (
        <CreateCustomerModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchCustomers(searchQuery, filterStatus);
          }}
        />
      )}
    </div>
  );
}

function CustomerStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-900/40 text-green-400 border-green-800/50",
    PAYMENT_PENDING: "bg-yellow-900/40 text-yellow-300 border-yellow-800/50",
    PAID: "bg-emerald-900/40 text-emerald-300 border-emerald-800/50",
    INACTIVE: "bg-white/5 text-white/40 border-white/10",
  };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 border tracking-wider uppercase ${map[status] || "bg-white/10 text-white/60 border-white/20"}`}>
      {(status || "ACTIVE").replace("_", " ")}
    </span>
  );
}

function CreateCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", mobile: "", email: "", address: "", city: "", state: "",
    state_code: "", pin_code: "", gstin: "", customer_type: "b2c",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"}/admin/billing/customers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create customer.");
      }
    } catch {
      setError("Failed to connect to backend.");
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full bg-[#181818] border border-white/20 p-2.5 text-white focus:border-gold outline-none text-xs";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-white/10 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-display text-xl text-white">Create Customer</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white text-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-400 text-[11px]">✕ {error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} required />
            </div>
            <div>
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Mobile</label>
              <input type="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value.replace(/[^0-9+]/g, "") })} className={inp} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inp} />
            </div>
            <div className="col-span-2">
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Address</label>
              <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inp} />
            </div>
            <div>
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">City</label>
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inp} />
            </div>
            <div>
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">State</label>
              <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className={inp} />
            </div>
            <div>
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">GSTIN</label>
              <input type="text" maxLength={15} value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} className={`${inp} uppercase font-mono`} />
            </div>
            <div>
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Type</label>
              <select value={form.customer_type} onChange={e => setForm({ ...form, customer_type: e.target.value })} className={inp}>
                <option value="b2c">B2C (Unregistered)</option>
                <option value="b2b">B2B (GST Registered)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-white/20 text-white/70 hover:text-white uppercase tracking-wider text-xs font-bold">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-gold hover:bg-gold-light text-[#070707] uppercase tracking-widest text-xs font-bold disabled:opacity-50">
              {saving ? "Creating..." : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
