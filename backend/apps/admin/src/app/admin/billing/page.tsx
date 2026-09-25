"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated, getAdminUser } from "@/lib/admin-auth";

import { billingFetch } from "@/lib/billing-api";

export default function BillingDashboardPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [invRes, dashRes] = await Promise.all([
        billingFetch("/admin/billing/invoices"),
        billingFetch("/admin/billing/dashboard"),
      ]);
      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(data.invoices || []);
        setBackendOnline(true);
      }
      if (dashRes.ok) {
        const data = await dashRes.json();
        setDashboard(data.dashboard);
      }
    } catch {
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const fmtCur = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const adminUser = getAdminUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xs">
        Loading Billing Module...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Backend offline warning */}
      {!backendOnline && (
        <div className="bg-red-950/60 border-b border-red-700/40 px-4 sm:px-8 py-3 text-red-200 text-xs">
          <strong>⚠ Medusa backend is offline.</strong> Billing data is unavailable.
          Start the backend: <code className="bg-red-900/40 px-1 mx-1">cd backend/apps/backend && npm run dev</code>
          then <button onClick={fetchData} className="underline ml-1 hover:text-white">retry</button>.
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Title + Actions */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h2 className="font-display text-3xl font-normal text-white">Offline Billing</h2>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <NavCard href="/admin/billing/create" icon="🧾" label="Create New Bill" accent />
          <NavCard href="/admin/billing/estimates" icon="📝" label="Estimates" />
          <NavCard href="/admin/billing/customers" icon="👥" label="Customer Directory" />
          <NavCard href="/admin/billing/history" icon="📋" label="Bill History" />
          <NavCard href="/admin/billing/pending" icon="⏳" label="Pending Payments" />
          <NavCard href="/admin/billing/settings" icon="⚙" label="Settings" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          <StatCard
            label="Today's Sales"
            value={dashboard ? fmtCur(dashboard.todays_sales) : "—"}
          />
          <StatCard
            label="Today's Bills"
            value={dashboard ? String(dashboard.todays_bills) : "—"}
          />
          <StatCard
            label="Total Outstanding"
            value={dashboard ? fmtCur(dashboard.total_outstanding) : "—"}
            warn={dashboard?.total_outstanding > 0}
          />
          <StatCard
            label="Overdue Payments"
            value={dashboard ? String(dashboard.overdue_payments) : "—"}
            warn={dashboard?.overdue_payments > 0}
          />
          <StatCard
            label="Customers"
            value={dashboard ? String(dashboard.customers) : "—"}
          />
          <StatCard
            label="GST Collected"
            value={dashboard ? fmtCur(dashboard.gst_collected_today) : "—"}
            sub="Today"
          />
        </div>

        {/* Recent Invoices */}
        <div className="bg-[#111111] border border-white/10 shadow-2xl">
          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-display text-lg text-white">Recent Invoices</h3>
            {invoices.length > 5 && (
              <Link href="/admin/billing/history" className="text-[10px] text-gold-light hover:text-white underline uppercase tracking-wider">
                View All →
              </Link>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs min-w-[700px]">
              <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-5">Invoice No</th>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Total (₹)</th>
                  <th className="py-3 px-5 text-right">Outstanding</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.slice(0, 8).map(inv => {
                  const outstanding = Number(inv.grand_total) - Number(inv.amount_paid || 0);
                  return (
                    <tr key={inv.id} className="hover:bg-[#161616] transition-colors">
                      <td className="py-3 px-5 font-mono font-medium text-white text-[11px]">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-5 text-white/90">
                        {inv.customer_name}
                        {inv.customer?.id && (
                          <Link
                            href={`/admin/billing/customers/${inv.customer.id}`}
                            className="ml-2 text-[9px] text-gold-light hover:text-white underline"
                          >
                            Profile ↗
                          </Link>
                        )}
                      </td>
                      <td className="py-3 px-5 text-white/60">
                        {new Date(inv.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 px-5 text-right font-serif text-sm text-gold font-bold">
                        {Number(inv.grand_total).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-5 text-right">
                        {outstanding > 0 ? (
                          <span className="text-amber-400 font-bold">₹{outstanding.toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="text-green-400/60">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <StatusBadge status={inv.payment_status} />
                      </td>
                      <td className="py-3 px-5 text-right">
                        <Link
                          href={`/admin/billing/history?id=${inv.id}`}
                          className="text-gold-light hover:text-white underline text-[10px] uppercase tracking-wider"
                        >
                          View ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-white/40">
                      {backendOnline
                        ? "No invoices yet. Create your first bill."
                        : "Backend offline — start Medusa backend to see invoices."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* GST Compliance Note */}
        <div className="mt-8 p-4 bg-amber-950/30 border border-amber-700/30 text-amber-200/70 text-[10px] leading-relaxed">
          <strong>⚠ GST Compliance:</strong> This system generates Tax Invoices in GST-compliant format. It does{" "}
          <strong>not</strong> register invoices with GSTN/IRP and does <strong>not</strong> generate an IRN or e-invoice
          QR code. If applicable to your business, e-invoicing requires a separate IRP integration and official credentials.
        </div>

      </main>
    </div>
  );
}

function NavCard({ href, icon, label, accent }: { href: string; icon: string; label: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`group p-5 border transition-all duration-200 hover:-translate-y-0.5 ${
        accent
          ? "bg-gold/10 border-gold/40 hover:bg-gold/20 hover:border-gold"
          : "bg-[#121212] border-white/10 hover:border-gold/40 hover:bg-[#161616]"
      }`}
    >
      <span className="text-2xl block mb-2">{icon}</span>
      <span className={`font-sans text-[11px] uppercase tracking-widest font-bold ${
        accent ? "text-gold" : "text-white/70 group-hover:text-gold-light"
      }`}>
        {label}
      </span>
    </Link>
  );
}

function StatCard({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className="bg-[#121212] border border-white/10 p-5">
      <p className="font-sans text-[10px] uppercase tracking-widest text-gold-light mb-1 font-semibold">{label}</p>
      <p className={`font-display text-xl font-bold ${warn ? "text-amber-400" : "text-white"}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-green-900/40 text-green-400 border-green-800/50",
    PARTIALLY_PAID: "bg-yellow-900/40 text-yellow-300 border-yellow-800/50",
    PENDING: "bg-orange-900/40 text-orange-300 border-orange-800/50",
    CANCELLED: "bg-red-900/40 text-red-300 border-red-800/50",
  };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 border tracking-wider uppercase ${map[status] || "bg-white/10 text-white/60 border-white/20"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
