"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

// ── Number to words utility (for "Amount in Words") ────────────────────────
const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
  "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
  "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numWords(n: number): string {
  if (n === 0) return "Zero";
  const chunk = (num: number): string => {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100) return tens[Math.floor(num / 10)] + " " + ones[num % 10] + " ";
    return ones[Math.floor(num / 100)] + " Hundred " + chunk(num % 100);
  };
  let result = "";
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) result += chunk(crore) + "Crore ";
  if (lakh) result += chunk(lakh) + "Lakh ";
  if (thousand) result += chunk(thousand) + "Thousand ";
  result += chunk(n);
  return result.trim() + " Rupees Only";
}

function BillingHistoryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id");

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    fetchData();
  }, [invoiceId, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, setRes] = await Promise.all([
        fetch(`${MEDUSA_URL}/admin/billing/invoices`),
        fetch(`${MEDUSA_URL}/admin/billing/settings`),
      ]);
      if (invRes.ok) {
        const data = await invRes.json();
        setInvoices(data.invoices || []);
        if (invoiceId) {
          const found = data.invoices?.find((i: any) => i.id === invoiceId);
          setSelectedInvoice(found || null);
        } else {
          setSelectedInvoice(null);
        }
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
      if (setRes.ok) {
        const sData = await setRes.json();
        setSettings(sData.settings);
      }
    } catch {
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const handleWhatsApp = (inv: any) => {
    const text = encodeURIComponent(
      `Dear ${inv.customer_name},\n\nThank you for your purchase at ${settings?.business_name || "Tirupati Jewellers"}.\n\nInvoice No: ${inv.invoice_number}\nDate: ${new Date(inv.created_at).toLocaleDateString("en-IN")}\nAmount: ₹${Number(inv.grand_total).toLocaleString("en-IN")}\nStatus: ${inv.payment_status}\n\nFor any queries, contact us at ${settings?.phone || "+91 94310 02445"}.\n\nThank you!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch =
      inv.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.mobile_number || "").includes(searchQuery) ||
      (inv.gstin || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === "ALL" || inv.payment_status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center text-white text-xs">
        Loading invoices...
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // INVOICE DETAIL VIEW + PRINT TEMPLATE
  // ═══════════════════════════════════════════════════════════════
  if (selectedInvoice) {
    const inv = selectedInvoice;
    const hasCgstSgst = Number(inv.cgst) > 0 || Number(inv.sgst) > 0;
    const invoiceDate = new Date(inv.created_at).toLocaleDateString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });

    return (
      <div className="min-h-screen bg-neutral-200 font-sans">

        {/* ── Web-only control bar (hidden on print) ────────────────── */}
        <div className="print:hidden bg-[#111111] px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/billing/history"
              className="text-xs text-white/70 hover:text-gold uppercase tracking-wider"
            >
              ← All Invoices
            </Link>
            <Link
              href="/admin/billing"
              className="text-xs text-white/70 hover:text-gold uppercase tracking-wider"
            >
              Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleWhatsApp(inv)}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-[11px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1.5"
            >
              📲 WhatsApp Share
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#d4af37] hover:bg-yellow-400 text-black text-[11px] uppercase font-bold tracking-wider transition-colors"
            >
              🖨️ Print Invoice
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-white/30 text-white hover:bg-white hover:text-black text-[11px] uppercase font-bold tracking-wider transition-colors"
            >
              📄 Download PDF
            </button>
          </div>
        </div>

        {/* ── The A4 Invoice Sheet ───────────────────────────────────── */}
        <div className="py-8 px-4 print:p-0 flex justify-center">
          <div
            id="tj-invoice-print"
            className="w-full max-w-[210mm] bg-white shadow-2xl print:shadow-none"
            style={{ minHeight: "297mm" }}
          >
            <div className="p-10 print:p-8">

              {/* Header */}
              <div className="flex justify-between items-start pb-5 mb-5 border-b-2 border-black">
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-widest uppercase mb-0.5">
                    {settings?.business_name || "TIRUPATI JEWELLERS"}
                  </h1>
                  {settings?.legal_name && settings.legal_name !== settings.business_name && (
                    <p className="text-[11px] text-gray-500">{settings.legal_name}</p>
                  )}
                  <p className="text-[11px] text-gray-700 mt-1">{settings?.business_address}</p>
                  <p className="text-[11px] text-gray-700">
                    {[settings?.city, settings?.state].filter(Boolean).join(", ")}
                    {settings?.pin_code ? ` — ${settings.pin_code}` : ""}
                  </p>
                  {settings?.phone && <p className="text-[11px] text-gray-700">Ph: {settings.phone}</p>}
                  {settings?.email && <p className="text-[11px] text-gray-700">Email: {settings.email}</p>}
                </div>
                <div className="text-right">
                  {settings?.gstin && (
                    <p className="text-[11px] font-bold">GSTIN: {settings.gstin}</p>
                  )}
                  {settings?.pan && (
                    <p className="text-[11px]">PAN: {settings.pan}</p>
                  )}
                  {settings?.state_code && (
                    <p className="text-[11px] text-gray-600">State Code: {settings.state_code}</p>
                  )}
                </div>
              </div>

              {/* Tax Invoice Label */}
              <div className="flex justify-center mb-6">
                <div className="border-2 border-black px-8 py-1.5 text-center">
                  <span className="font-bold uppercase tracking-[0.35em] text-sm">Tax Invoice</span>
                </div>
              </div>

              {/* Invoice Meta + Bill To */}
              <div className="grid grid-cols-2 gap-6 mb-6 text-[11px]">
                <div className="border border-gray-300 p-3">
                  <p className="font-bold uppercase text-[9px] tracking-widest text-gray-500 mb-2">Bill To</p>
                  <p className="font-bold text-base">{inv.customer_name}</p>
                  {inv.mobile_number && <p className="text-gray-700">Ph: {inv.mobile_number}</p>}
                  {inv.address && <p className="text-gray-700">{inv.address}</p>}
                  {(inv.city || inv.state) && (
                    <p className="text-gray-700">
                      {[inv.city, inv.state].filter(Boolean).join(", ")}
                      {inv.state_code ? ` (Code: ${inv.state_code})` : ""}
                    </p>
                  )}
                  {inv.pin_code && <p className="text-gray-700">PIN: {inv.pin_code}</p>}
                  {inv.gstin && (
                    <p className="font-bold mt-1 uppercase tracking-wider text-[10px]">
                      GSTIN: {inv.gstin}
                    </p>
                  )}
                </div>
                <div className="border border-gray-300 p-3 space-y-1">
                  <p className="font-bold uppercase text-[9px] tracking-widest text-gray-500 mb-2">Invoice Details</p>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Invoice No:</span>
                    <span className="font-bold font-mono">{inv.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Date:</span>
                    <span>{invoiceDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Payment:</span>
                    <span>{inv.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Status:</span>
                    <span className="font-bold">{inv.payment_status.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Place of Supply:</span>
                    <span>{inv.state || "-"} ({inv.state_code || "-"})</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full border-collapse text-[10px] mb-1">
                <thead>
                  <tr className="bg-gray-100 border border-black">
                    <th className="border border-black p-2 text-center w-8">#</th>
                    <th className="border border-black p-2 text-left">Description of Goods</th>
                    <th className="border border-black p-2 text-center w-16">HSN/SAC</th>
                    <th className="border border-black p-2 text-center w-10">Qty</th>
                    <th className="border border-black p-2 text-center w-16">Wt. (g)</th>
                    <th className="border border-black p-2 text-right w-20">Rate (₹)</th>
                    <th className="border border-black p-2 text-right w-16">Disc. (₹)</th>
                    <th className="border border-black p-2 text-right w-20">Taxable (₹)</th>
                    <th className="border border-black p-2 text-center w-12">GST%</th>
                    <th className="border border-black p-2 text-right w-20">Amt (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.items?.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b border-gray-300">
                      <td className="border-x border-black p-2 text-center">{idx + 1}</td>
                      <td className="border-x border-black p-2">
                        <p className="font-bold">{item.product_name}</p>
                        {item.purity && <p className="text-gray-500 text-[9px]">{item.purity}</p>}
                        {item.sku && <p className="text-gray-400 text-[8px]">SKU: {item.sku}</p>}
                      </td>
                      <td className="border-x border-black p-2 text-center font-mono">{item.hsn || "—"}</td>
                      <td className="border-x border-black p-2 text-center">{item.quantity}</td>
                      <td className="border-x border-black p-2 text-center">{item.net_weight || "—"}</td>
                      <td className="border-x border-black p-2 text-right">{Number(item.rate).toFixed(2)}</td>
                      <td className="border-x border-black p-2 text-right">{Number(item.discount || 0).toFixed(2)}</td>
                      <td className="border-x border-black p-2 text-right">{Number(item.taxable_value).toFixed(2)}</td>
                      <td className="border-x border-black p-2 text-center">{item.gst_rate}%</td>
                      <td className="border-x border-black p-2 text-right font-bold">{Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Filler row */}
                  <tr className="border-b border-black">
                    <td colSpan={10} className="p-3 h-8"></td>
                  </tr>
                </tbody>
              </table>

              {/* Totals + Amount in Words */}
              <div className="flex border-x border-b border-black text-[11px]">
                {/* Left: Amount in words + Terms */}
                <div className="flex-1 p-4 border-r border-black">
                  <p className="font-bold mb-1">Amount in Words:</p>
                  <p className="italic text-gray-700 leading-relaxed">
                    {numWords(Math.round(inv.grand_total))}
                  </p>

                  {settings?.terms_conditions && (
                    <div className="mt-6">
                      <p className="font-bold uppercase text-[9px] tracking-widest text-gray-500 mb-1">Terms & Conditions</p>
                      <p className="text-gray-600 text-[10px] whitespace-pre-line leading-relaxed">
                        {settings.terms_conditions}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 p-2 bg-gray-50 border border-gray-200 text-[9px] text-gray-500">
                    ⚠ This is a computer-generated tax invoice. Not an e-invoice / IRN.
                  </div>
                </div>

                {/* Right: Tax breakdown */}
                <div className="w-56 shrink-0">
                  <TaxRow label="Subtotal" value={`₹${Number(inv.subtotal).toFixed(2)}`} />
                  {Number(inv.discount) > 0 && (
                    <TaxRow label="Discount" value={`-₹${Number(inv.discount).toFixed(2)}`} />
                  )}
                  <TaxRow label="Taxable Amount" value={`₹${Number(inv.taxable_amount).toFixed(2)}`} bold />
                  {hasCgstSgst ? (
                    <>
                      <TaxRow label="CGST" value={`₹${Number(inv.cgst).toFixed(2)}`} />
                      <TaxRow label="SGST" value={`₹${Number(inv.sgst).toFixed(2)}`} />
                    </>
                  ) : (
                    <TaxRow label="IGST" value={`₹${Number(inv.igst).toFixed(2)}`} />
                  )}
                  <TaxRow label="Round Off" value={(Number(inv.round_off) >= 0 ? "+" : "") + `₹${Number(inv.round_off).toFixed(2)}`} />
                  <div className="flex justify-between p-2.5 bg-gray-100 font-bold text-base border-t border-black">
                    <span>Grand Total</span>
                    <span>₹{Number(inv.grand_total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end mt-12 pt-4 px-4">
                <div className="text-center text-[10px]">
                  <div className="border-t border-black w-36 mb-1 mx-auto" />
                  <p className="font-bold uppercase tracking-wider">Customer Signature</p>
                </div>
                <div className="text-center text-[10px]">
                  <p className="text-gray-600 mb-8">For {settings?.business_name || "Tirupati Jewellers"}</p>
                  <div className="border-t border-black w-44 mb-1 mx-auto" />
                  <p className="font-bold uppercase tracking-wider">
                    {settings?.authorized_signatory || "Authorized Signatory"}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // INVOICE HISTORY LIST
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="bg-[#111111] border-b border-gold/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold">👑</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">TIRUPATI JEWELLERS</h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">INVOICE HISTORY</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/billing" className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider">
            ← Dashboard
          </Link>
          <Link href="/admin/billing/create" className="bg-gold hover:bg-gold-light text-[#070707] px-4 py-1.5 text-xs uppercase tracking-widest font-bold transition-colors">
            + New Invoice
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-xs">

        {!backendOnline && (
          <div className="mb-6 p-4 bg-red-950/80 border border-red-500/60 text-red-200 text-xs">
            ⚠ <strong>Medusa backend is offline.</strong> Invoice history is unavailable until the backend is running.
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <h2 className="font-display text-2xl font-normal text-white">All GST Invoices</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search by invoice no / name / mobile / GSTIN..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#181818] border border-white/20 px-4 py-2 text-white outline-none focus:border-gold w-72"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-[#181818] border border-white/20 px-3 py-2 text-white outline-none focus:border-gold"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 shadow-2xl overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5">Invoice No</th>
                <th className="py-4 px-5">Customer</th>
                <th className="py-4 px-5">Mobile</th>
                <th className="py-4 px-5 text-right">Taxable</th>
                <th className="py-4 px-5 text-right">GST</th>
                <th className="py-4 px-5 text-right">Total (₹)</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-[#161616] transition-colors">
                  <td className="py-3 px-5 text-white/60">
                    {new Date(inv.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-3 px-5 font-mono font-medium text-white text-[11px]">{inv.invoice_number}</td>
                  <td className="py-3 px-5 text-white/90">
                    {inv.customer_name}
                    {inv.gstin && (
                      <span className="ml-2 bg-blue-900/40 text-blue-300 text-[8px] px-1.5 py-0.5 border border-blue-800">
                        B2B
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-white/60">{inv.mobile_number || "—"}</td>
                  <td className="py-3 px-5 text-right text-white/70">
                    {Number(inv.taxable_amount).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-5 text-right text-white/70">
                    {(Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst)).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-5 text-right font-serif text-sm text-gold font-bold">
                    {Number(inv.grand_total).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <StatusBadge status={inv.payment_status} />
                  </td>
                  <td className="py-3 px-5 text-center">
                    <Link
                      href={`/admin/billing/history?id=${inv.id}`}
                      className="text-gold-light hover:text-white underline uppercase tracking-widest text-[10px]"
                    >
                      View & Print
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-white/40">
                    {backendOnline ? "No invoices found." : "Backend offline."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-white/30 text-[10px] mt-4 text-right">
          {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""} shown
        </p>

      </main>
    </div>
  );
}

function TaxRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between p-2 border-b border-gray-200 text-[11px] ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
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

// Suspense wrapper because useSearchParams requires it
export default function BillingHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070707] flex items-center justify-center text-white text-xs">Loading...</div>}>
      <BillingHistoryInner />
    </Suspense>
  );
}
