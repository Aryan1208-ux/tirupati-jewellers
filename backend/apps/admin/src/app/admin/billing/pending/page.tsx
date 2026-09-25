"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { billingFetch } from "@/lib/billing-api";
import { isAdminAuthenticated, getAdminUser } from "@/lib/admin-auth";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

export default function PendingPaymentsPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [filterOverdue, setFilterOverdue] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    fetchPending();
  }, [router]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await billingFetch(`/admin/billing/pending`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  };

  const fmtCur = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const filtered = filterOverdue ? invoices.filter(i => i.is_overdue) : invoices;
  const totalOutstanding = filtered.reduce((s, inv) => s + Number(inv.outstanding || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="bg-[#111111] border-b border-gold/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold">👑</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">TIRUPATI JEWELLERS</h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">PENDING PAYMENTS</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/billing" className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider">← Billing Dashboard</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-xs">

        {/* Summary */}
        <div className="flex flex-wrap justify-between items-end mb-6 gap-4">
          <div>
            <h2 className="font-display text-2xl font-normal text-white mb-1">Pending Payments</h2>
            <p className="text-white/40">
              {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} with total outstanding of{" "}
              <span className="text-amber-400 font-bold">{fmtCur(totalOutstanding)}</span>
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 text-white/60 cursor-pointer">
              <input type="checkbox" checked={filterOverdue} onChange={e => setFilterOverdue(e.target.checked)} className="accent-gold" />
              <span className="text-[11px] uppercase tracking-wider">Overdue Only</span>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/40">Loading pending payments...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#111111] border border-white/10 p-12 text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-white/50">No pending payments. All invoices are fully paid!</p>
          </div>
        ) : (
          <div className="bg-[#111111] border border-white/10 shadow-2xl overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-4 px-5">Invoice No</th>
                  <th className="py-4 px-5">Customer</th>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Due Date</th>
                  <th className="py-4 px-5 text-right">Total</th>
                  <th className="py-4 px-5 text-right">Paid</th>
                  <th className="py-4 px-5 text-right">Outstanding</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(inv => (
                  <tr key={inv.id} className={`hover:bg-[#161616] transition-colors ${inv.is_overdue ? "bg-red-950/10" : ""}`}>
                    <td className="py-3 px-5 font-mono font-medium text-white text-[11px]">{inv.invoice_number}</td>
                    <td className="py-3 px-5">
                      <span className="text-white/90">{inv.customer_name}</span>
                      {inv.customer?.id && (
                        <Link href={`/admin/billing/customers/${inv.customer.id}`} className="ml-2 text-[9px] text-gold-light hover:text-white underline">Profile ↗</Link>
                      )}
                    </td>
                    <td className="py-3 px-5 text-white/60">{fmtDate(inv.created_at)}</td>
                    <td className="py-3 px-5">
                      {inv.due_date ? (
                        <span className={inv.is_overdue ? "text-red-400 font-bold" : "text-white/70"}>
                          {fmtDate(inv.due_date)}
                          {inv.is_overdue && " ⚠"}
                        </span>
                      ) : (
                        <span className="text-white/30">Not set</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right text-white/70">{fmtCur(Number(inv.grand_total))}</td>
                    <td className="py-3 px-5 text-right text-green-400">{fmtCur(Number(inv.amount_paid || 0))}</td>
                    <td className="py-3 px-5 text-right">
                      <span className="text-amber-400 font-bold">{fmtCur(Number(inv.outstanding))}</span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className={`text-[9px] font-bold px-2 py-0.5 border tracking-wider uppercase ${
                        inv.payment_status === "PARTIALLY_PAID"
                          ? "bg-yellow-900/40 text-yellow-300 border-yellow-800/50"
                          : "bg-orange-900/40 text-orange-300 border-orange-800/50"
                      }`}>
                        {inv.payment_status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center space-x-2">
                      <button
                        onClick={() => { setSelectedInvoice(inv); setShowPayModal(true); }}
                        className="text-green-400 hover:text-green-300 text-[10px] underline uppercase tracking-wider"
                      >
                        Record Payment
                      </button>
                      <Link href={`/admin/billing/history?id=${inv.id}`} className="text-gold-light hover:text-white text-[10px] underline uppercase tracking-wider">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Quick Payment Modal */}
      {showPayModal && selectedInvoice && (
        <QuickPayModal
          invoice={selectedInvoice}
          fmtCur={fmtCur}
          onClose={() => { setShowPayModal(false); setSelectedInvoice(null); }}
          onPaid={() => { setShowPayModal(false); setSelectedInvoice(null); fetchPending(); }}
        />
      )}
    </div>
  );
}

function QuickPayModal({ invoice, fmtCur, onClose, onPaid }: any) {
  const outstanding = Number(invoice.outstanding || Number(invoice.grand_total) - Number(invoice.amount_paid || 0));
  const [amount, setAmount] = useState(outstanding);
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > outstanding) {
      setError(`Amount must be between ₹1 and ${fmtCur(outstanding)}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `/api/medusa/admin/billing/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoice_id: invoice.id,
            customer_id: invoice.customer?.id || null,
            amount,
            payment_method: method,
            reference_number: reference || null,
            recorded_by: getAdminUser() || "Admin",
          }),
        }
      );
      if (res.ok) {
        onPaid();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to record payment.");
      }
    } catch {
      setError("Failed to connect.");
    } finally { setSaving(false); }
  };

  const inp = "w-full bg-[#181818] border border-white/20 p-2.5 text-white focus:border-gold outline-none text-xs";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-white/10 shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10">
          <h3 className="font-display text-xl text-white">Record Payment</h3>
          <p className="text-white/40 text-[11px] mt-1">Invoice: {invoice.invoice_number} • {invoice.customer_name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-400 text-[11px]">✕ {error}</p>}

          <div className="bg-[#0a0a0a] p-3 border border-white/10 flex justify-between">
            <span className="text-white/50">Outstanding</span>
            <span className="text-amber-400 font-bold">{fmtCur(outstanding)}</span>
          </div>

          <div>
            <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Amount *</label>
            <input type="number" min={1} max={outstanding} value={amount} onChange={e => setAmount(Number(e.target.value))} className={inp} required />
          </div>
          <div>
            <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className={inp}>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Reference</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)} className={inp} placeholder="Transaction ID" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-white/20 text-white/70 uppercase tracking-wider text-xs font-bold">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-green-700 hover:bg-green-600 text-white uppercase tracking-widest text-xs font-bold disabled:opacity-50">
              {saving ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
