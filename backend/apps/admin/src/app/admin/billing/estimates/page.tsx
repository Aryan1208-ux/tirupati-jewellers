"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { billingFetch } from "@/lib/billing-api";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default function EstimatesPage() {
  const router = useRouter();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    fetchEstimates();
  }, [router]);

  const fetchEstimates = async () => {
    setLoading(true);
    try {
      const res = await billingFetch("/admin/billing/estimates");
      if (res.ok) {
        const data = await res.json();
        setEstimates(data.estimates);
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

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xs">Loading estimates...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="bg-[#111111] border-b border-gold/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold">👑</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">TIRUPATI JEWELLERS</h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">ESTIMATES</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/billing/estimates/create" className="bg-gold hover:bg-gold-light text-[#070707] px-5 py-2 text-xs uppercase tracking-widest font-bold transition-all">
            + New Estimate
          </Link>
          <Link href="/admin/billing" className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider">Dashboard</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#111111] border border-white/10 shadow-2xl overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-[#181818] border-b border-white/10 text-[10px] uppercase tracking-wider text-gold-light">
              <tr>
                <th className="py-4 px-6 font-semibold">Estimate No</th>
                <th className="py-4 px-6 font-semibold">Date</th>
                <th className="py-4 px-6 font-semibold">Customer</th>
                <th className="py-4 px-6 font-semibold">Amount</th>
                <th className="py-4 px-6 font-semibold text-center">Status</th>
                <th className="py-4 px-6 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {estimates.map((est) => (
                <tr key={est.id} className="hover:bg-[#161616] transition-colors">
                  <td className="py-3 px-6 text-[11px] font-mono text-white font-medium">{est.estimate_number}</td>
                  <td className="py-3 px-6 text-xs text-white/60">{fmtDate(est.created_at)}</td>
                  <td className="py-3 px-6 text-xs text-white/80">
                    <p className="font-bold">{est.customer_name}</p>
                    {est.mobile_number && <p className="text-[10px] text-white/40">{est.mobile_number}</p>}
                  </td>
                  <td className="py-3 px-6 text-sm font-serif text-gold font-bold">{fmtCur(Number(est.grand_total))}</td>
                  <td className="py-3 px-6 text-center">
                    <span className={`px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold rounded-sm border ${
                      est.status === 'CONVERTED' ? 'bg-green-900/40 text-green-400 border-green-800/50' :
                      est.status === 'DRAFT' ? 'bg-gray-800/40 text-gray-400 border-gray-700/50' :
                      est.status === 'ISSUED' ? 'bg-blue-900/40 text-blue-400 border-blue-800/50' :
                      'bg-red-900/40 text-red-400 border-red-800/50'
                    }`}>
                      {est.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <Link href={`/admin/billing/estimates/${est.id}`} className="text-[10px] text-gold hover:text-white uppercase tracking-wider font-bold underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {estimates.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40 text-xs">No estimates found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
