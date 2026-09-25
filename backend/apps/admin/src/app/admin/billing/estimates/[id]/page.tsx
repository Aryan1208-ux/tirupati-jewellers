"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { billingFetch } from "@/lib/billing-api";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default function EstimateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [estimate, setEstimate] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    fetchData();
  }, [id, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [estRes, setRes] = await Promise.all([
        billingFetch(`/admin/billing/estimates/${id}`),
        billingFetch(`/admin/billing/settings`),
      ]);
      if (estRes.ok) {
        const data = await estRes.json();
        setEstimate(data.estimate);
      }
      if (setRes.ok) {
        const sData = await setRes.json();
        setSettings(sData.settings);
      }
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleConvert = async () => {
    if (!confirm("Are you sure you want to convert this estimate to a final invoice?")) return;
    setConverting(true);
    try {
      const res = await billingFetch(`/admin/billing/estimates/${id}/convert`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully converted! Invoice No: ${data.invoice.invoice_number}`);
        router.push(`/admin/billing/history?id=${data.invoice.id}`);
      } else {
        const err = await res.json();
        alert(`Failed to convert: ${err.error}`);
      }
    } catch (error: any) {
      alert("Conversion error.");
    } finally {
      setConverting(false);
      fetchData();
    }
  };

  const fmtCur = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const handleShare = () => {
    if (!estimate) return;
    const text = `*Estimate from ${settings?.business_name || "Tirupati Jewellers"}*\nEstimate No: ${estimate.estimate_number}\nDate: ${fmtDate(estimate.created_at)}\nCustomer: ${estimate.customer_name}\n\n*Items:*\n${estimate.items.map((i: any) => `- ${i.product_name} (${i.quantity}x): ${fmtCur(Number(i.total))}`).join("\n")}\n\n*Total Amount:* ${fmtCur(Number(estimate.grand_total))}\nValid Until: ${fmtDate(estimate.valid_until)}\n\nThank you for your business!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xs">Loading estimate...</div>;
  if (!estimate) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xs">Estimate not found.</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="bg-[#111111] border-b border-gold/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold">👑</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">TIRUPATI JEWELLERS</h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">ESTIMATE DETAIL</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/billing/estimates" className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider">← Estimates</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h2 className="font-display text-2xl text-white">Estimate {estimate.estimate_number}</h2>
          <div className="flex gap-4">
            <button onClick={handleShare} className="px-5 py-2 border border-blue-500/30 text-blue-400 hover:bg-blue-900/30 hover:text-white uppercase tracking-wider text-xs font-bold transition-colors">
              Share (WA)
            </button>
            <button onClick={handlePrint} className="px-5 py-2 border border-white/20 text-white/80 hover:text-white uppercase tracking-wider text-xs font-bold transition-colors">
              Print PDF
            </button>
            {estimate.status !== 'CONVERTED' && estimate.status !== 'EXPIRED' && estimate.status !== 'REJECTED' && (
              <button 
                onClick={handleConvert} 
                disabled={converting}
                className="bg-green-700 hover:bg-green-600 text-white px-5 py-2 uppercase tracking-widest text-xs font-bold transition-all disabled:opacity-50"
              >
                {converting ? "Converting..." : "Convert to Invoice"}
              </button>
            )}
            {estimate.status === 'CONVERTED' && (
              <Link href={`/admin/billing/history?id=${estimate.converted_to_invoice_id}`} className="bg-blue-900/40 text-blue-300 border border-blue-800 px-5 py-2 uppercase tracking-widest text-xs font-bold transition-all">
                View Invoice
              </Link>
            )}
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div className="bg-white text-black p-10 max-w-[800px] mx-auto shadow-2xl relative min-h-[1050px]" id="printable-estimate">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-amber-800/20 pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-serif text-amber-900 font-bold mb-1 tracking-wider uppercase">
                {settings?.business_name || "Tirupati Jewellers"}
              </h1>
              <p className="text-sm text-gray-600 max-w-sm leading-relaxed">{settings?.address}</p>
              <div className="mt-2 space-y-0.5 text-xs text-gray-500 font-mono">
                {settings?.gstin && <p>GSTIN: <span className="font-semibold text-gray-800">{settings.gstin}</span></p>}
                <p>State Code: {settings?.state_code}</p>
                {settings?.phone && <p>Ph: {settings.phone}</p>}
                {settings?.email && <p>Email: {settings.email}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-serif font-bold text-amber-900 mb-2 uppercase tracking-[0.2em]">Estimate</h2>
              <div className="bg-amber-50 p-3 rounded border border-amber-100 inline-block text-left">
                <table className="text-xs">
                  <tbody>
                    <tr><td className="pr-4 py-1 text-amber-800/70 font-semibold">Estimate No:</td><td className="font-mono font-bold">{estimate.estimate_number}</td></tr>
                    <tr><td className="pr-4 py-1 text-amber-800/70 font-semibold">Date:</td><td className="font-semibold">{fmtDate(estimate.created_at)}</td></tr>
                    <tr><td className="pr-4 py-1 text-amber-800/70 font-semibold">Valid Until:</td><td className="font-semibold">{fmtDate(estimate.valid_until)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6 flex gap-8">
            <div className="flex-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-800/50 mb-2">Estimate To:</h3>
              <p className="font-serif font-bold text-lg mb-1">{estimate.customer_name}</p>
              {estimate.mobile_number && <p className="text-sm font-mono text-gray-700">{estimate.mobile_number}</p>}
              <p className="text-sm text-gray-600 mt-1 max-w-xs leading-relaxed">
                {[estimate.address, estimate.city, estimate.state].filter(Boolean).join(", ")}
                {estimate.pin_code ? ` - ${estimate.pin_code}` : ""}
              </p>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full text-sm mb-6 mt-4 border-collapse">
            <thead className="bg-amber-900 text-white">
              <tr>
                <th className="py-2 px-3 text-left border-r border-amber-800 w-10">S.N.</th>
                <th className="py-2 px-3 text-left border-r border-amber-800">Description</th>
                <th className="py-2 px-3 text-right border-r border-amber-800">Gross Wt.</th>
                <th className="py-2 px-3 text-right border-r border-amber-800">Net Wt.</th>
                <th className="py-2 px-3 text-right border-r border-amber-800">Rate</th>
                <th className="py-2 px-3 text-right border-r border-amber-800">Discount</th>
                <th className="py-2 px-3 text-right border-r border-amber-800">Taxable</th>
                <th className="py-2 px-3 text-right border-r border-amber-800">GST</th>
                <th className="py-2 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items?.map((item: any, i: number) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-2 px-3 border-r border-gray-200 text-center">{i + 1}</td>
                  <td className="py-2 px-3 border-r border-gray-200">
                    <span className="font-semibold block">{item.product_name}</span>
                    {item.hsn && <span className="text-[10px] text-gray-400 font-mono">HSN: {item.hsn}</span>}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-gray-200 font-mono">{item.gross_weight || "-"}</td>
                  <td className="py-2 px-3 text-right border-r border-gray-200 font-mono">{item.net_weight || "-"}</td>
                  <td className="py-2 px-3 text-right border-r border-gray-200 font-mono">{fmtCur(Number(item.rate))}</td>
                  <td className="py-2 px-3 text-right border-r border-gray-200 font-mono">{item.discount > 0 ? fmtCur(Number(item.discount)) : "-"}</td>
                  <td className="py-2 px-3 text-right border-r border-gray-200 font-mono">{fmtCur(Number(item.taxable_value))}</td>
                  <td className="py-2 px-3 text-right border-r border-gray-200 font-mono">
                    {item.gst_amount > 0 ? `${fmtCur(Number(item.gst_amount))} (${item.gst_rate}%)` : "-"}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold">{fmtCur(Number(item.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
            <div className="w-1/2">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-600 text-right">Total Taxable Value</td>
                    <td className="py-2 text-right font-mono font-semibold w-32">{fmtCur(Number(estimate.taxable_amount))}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-600 text-right">CGST</td>
                    <td className="py-2 text-right font-mono font-semibold">{fmtCur(Number(estimate.cgst))}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-600 text-right">SGST</td>
                    <td className="py-2 text-right font-mono font-semibold">{fmtCur(Number(estimate.sgst))}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 pr-4 text-gray-600 text-right">IGST</td>
                    <td className="py-2 text-right font-mono font-semibold">{fmtCur(Number(estimate.igst))}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 pr-4 text-gray-600 text-right">Round Off</td>
                    <td className="py-2 text-right font-mono text-gray-500">{fmtCur(Number(estimate.round_off))}</td>
                  </tr>
                  <tr className="bg-amber-50 border-b-2 border-amber-900">
                    <td className="py-3 pr-4 text-amber-900 text-right font-bold text-lg uppercase tracking-wider">Grand Total</td>
                    <td className="py-3 text-right font-mono font-bold text-xl text-amber-950">{fmtCur(Number(estimate.grand_total))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Info */}
          {estimate.notes && (
            <div className="mb-12">
              <h4 className="text-[10px] uppercase tracking-widest text-amber-800/50 mb-1 font-bold">Notes</h4>
              <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed max-w-2xl bg-amber-50/50 p-3 rounded">
                {estimate.notes}
              </p>
            </div>
          )}

          <div className="absolute bottom-10 left-10 right-10">
            <div className="flex justify-between items-end border-t border-gray-200 pt-6">
              <div className="text-[10px] text-gray-400">
                <p>This is an estimate, not a tax invoice.</p>
                <p>Subject to change upon final billing.</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-8">For {settings?.business_name}</p>
                <div className="border-t border-gray-400 w-48 mx-auto"></div>
                <p className="text-[10px] uppercase tracking-wider text-gray-800 mt-2 font-bold">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
