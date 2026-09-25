"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { billingFetch } from "@/lib/billing-api";
import { isAdminAuthenticated, getAdminUser } from "@/lib/admin-auth";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

type Tab = "overview" | "bills" | "payments" | "messages" | "followups" | "notes" | "estimates" | "greetings" | "activity";

export default function CustomerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderInvoice, setReminderInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    fetchCustomer();
  }, [customerId, router]);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billingFetch(`/admin/billing/customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
        setSummary(data.summary);
      }
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fmtCur = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const fmtDateTime = (d: string) => new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xs">Loading customer...</div>;
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xs">
        Customer not found. <Link href="/admin/billing/customers" className="underline text-gold ml-2">← Back to Directory</Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "bills", label: "Bills", count: customer.invoices?.length },
    { key: "payments", label: "Payments", count: customer.payments?.length },
    { key: "messages", label: "Messages", count: customer.message_logs?.length },
    { key: "followups", label: "Follow-ups", count: customer.follow_ups?.length },
    { key: "notes", label: "Notes", count: customer.notes?.length },
    { key: "estimates", label: "Estimates", count: customer.estimates?.length },
    { key: "greetings", label: "Greetings", count: customer.greetings?.length },
    { key: "activity", label: "Website Activity" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111111] border-b border-gold/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold">👑</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">TIRUPATI JEWELLERS</h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">CUSTOMER PROFILE</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/billing/customers" className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider">← Customer Directory</Link>
          <Link href="/admin/billing" className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider">Dashboard</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans text-xs">

        {/* Customer Summary Header */}
        <div className="bg-[#111111] border border-white/10 p-6 mb-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl text-white mb-1">{customer.name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-white/60">
                {customer.mobile && <span className="font-mono">📱 {customer.mobile}</span>}
                {customer.email && <span>✉ {customer.email}</span>}
                {customer.city && <span>📍 {customer.city}{customer.state ? `, ${customer.state}` : ""}</span>}
                {customer.gstin && <span className="font-mono text-blue-300">GSTIN: {customer.gstin}</span>}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <CustomerStatusBadge status={customer.status} />
                <span className="text-[9px] text-white/30 uppercase tracking-wider">
                  Customer since {fmtDate(customer.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mt-6 pt-6 border-t border-white/10">
            <MiniStat label="Total Purchases" value={fmtCur(summary?.total_purchases || 0)} />
            <MiniStat label="Paid" value={fmtCur(summary?.total_paid || 0)} color="text-green-400" />
            <MiniStat label="Outstanding" value={fmtCur(summary?.outstanding || 0)} color={summary?.outstanding > 0 ? "text-amber-400" : "text-green-400"} />
            <MiniStat label="Invoices" value={String(summary?.invoice_count || 0)} />
            <MiniStat label="Last Purchase" value={summary?.last_purchase ? fmtDate(summary.last_purchase) : "—"} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b border-white/10 pb-px">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-[11px] uppercase tracking-widest font-bold transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "text-gold border-gold"
                  : "text-white/50 border-transparent hover:text-white/80 hover:border-white/20"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 text-[9px] bg-white/10 px-1.5 py-0.5 rounded-sm">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <OverviewTab customer={customer} summary={summary} fmtCur={fmtCur} fmtDate={fmtDate} fmtDateTime={fmtDateTime} />
        )}
        {activeTab === "bills" && (
          <BillsTab
            invoices={customer.invoices || []}
            fmtCur={fmtCur}
            fmtDate={fmtDate}
            onSendReminder={(inv: any) => { setReminderInvoice(inv); setShowReminderModal(true); }}
            onRecordPayment={(inv: any) => { setPaymentInvoice(inv); setShowPaymentModal(true); }}
          />
        )}
        {activeTab === "payments" && (
          <PaymentsTab payments={customer.payments || []} fmtCur={fmtCur} fmtDateTime={fmtDateTime} />
        )}
        {activeTab === "messages" && (
          <MessagesTab messages={customer.message_logs || []} fmtDateTime={fmtDateTime} />
        )}
        {activeTab === "followups" && (
          <FollowUpsTab customerId={customerId} followUps={customer.follow_ups || []} fmtDate={fmtDate} onRefresh={fetchCustomer} />
        )}
        {activeTab === "notes" && (
          <NotesTab customerId={customerId} notes={customer.notes || []} fmtDateTime={fmtDateTime} onRefresh={fetchCustomer} />
        )}
        {activeTab === "estimates" && (
          <EstimatesTab estimates={customer.estimates || []} fmtCur={fmtCur} fmtDate={fmtDate} />
        )}
        {activeTab === "greetings" && (
          <GreetingsTab customer={customer} greetings={customer.greetings || []} fmtDateTime={fmtDateTime} onRefresh={fetchCustomer} />
        )}
        {activeTab === "activity" && (
          <ActivityTab customerId={customerId} />
        )}
      </main>

      {/* Payment Reminder Modal */}
      {showReminderModal && reminderInvoice && (
        <ReminderModal
          customer={customer}
          invoice={reminderInvoice}
          fmtCur={fmtCur}
          onClose={() => { setShowReminderModal(false); setReminderInvoice(null); }}
          onSent={() => { setShowReminderModal(false); setReminderInvoice(null); fetchCustomer(); }}
        />
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && paymentInvoice && (
        <RecordPaymentModal
          customer={customer}
          invoice={paymentInvoice}
          fmtCur={fmtCur}
          onClose={() => { setShowPaymentModal(false); setPaymentInvoice(null); }}
          onRecorded={() => { setShowPaymentModal(false); setPaymentInvoice(null); fetchCustomer(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ═══════════════════════════════════════════════════════════════════════════ */
function OverviewTab({ customer, summary, fmtCur, fmtDate, fmtDateTime }: any) {
  // Build activity timeline from invoices, payments, messages
  const timeline: any[] = [];

  (customer.invoices || []).forEach((inv: any) => {
    timeline.push({
      type: "invoice",
      date: inv.created_at,
      label: `Invoice ${inv.invoice_number}`,
      detail: `${fmtCur(Number(inv.grand_total))} — ${inv.payment_status.replace("_", " ")}`,
    });
  });

  (customer.payments || []).forEach((p: any) => {
    timeline.push({
      type: "payment",
      date: p.payment_date,
      label: `Payment Received`,
      detail: `${fmtCur(Number(p.amount))} via ${p.payment_method}`,
    });
  });

  (customer.message_logs || []).forEach((m: any) => {
    timeline.push({
      type: "message",
      date: m.created_at,
      label: `${m.message_type?.replace("_", " ")} (${m.channel})`,
      detail: `Sent by ${m.sent_by || "System"} — ${m.delivery_status}`,
    });
  });

  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Info + Pending */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-[#111111] border border-white/10 p-5">
          <h4 className="text-gold-light uppercase tracking-widest text-[10px] font-bold mb-3">Customer Information</h4>
          <dl className="space-y-2 text-white/70">
            <InfoRow label="Name" value={customer.name} />
            <InfoRow label="Mobile" value={customer.mobile} />
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="Address" value={[customer.address, customer.city, customer.state].filter(Boolean).join(", ")} />
            <InfoRow label="GSTIN" value={customer.gstin} />
            <InfoRow label="Type" value={customer.customer_type?.toUpperCase()} />
            {customer.date_of_birth && <InfoRow label="Date of Birth" value={fmtDate(customer.date_of_birth)} />}
            {customer.anniversary_date && <InfoRow label="Anniversary" value={fmtDate(customer.anniversary_date)} />}
            
            <div className="pt-2 mt-2 border-t border-white/10">
              <span className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">Opt-ins</span>
              <div className="flex gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${customer.greeting_opt_in ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>Greetings</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${customer.whatsapp_opt_in ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>WhatsApp</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${customer.sms_opt_in ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>SMS</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${customer.email_opt_in ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>Email</span>
              </div>
            </div>
          </dl>
        </div>

        {summary?.outstanding > 0 && (
          <div className="bg-amber-950/30 border border-amber-700/30 p-5">
            <h4 className="text-amber-400 uppercase tracking-widest text-[10px] font-bold mb-2">Outstanding Balance</h4>
            <p className="font-display text-3xl font-bold text-amber-400">{fmtCur(summary.outstanding)}</p>
          </div>
        )}

        {/* Upcoming follow-ups */}
        {customer.follow_ups?.filter((f: any) => f.status === "PENDING").length > 0 && (
          <div className="bg-[#111111] border border-white/10 p-5">
            <h4 className="text-gold-light uppercase tracking-widest text-[10px] font-bold mb-3">Upcoming Follow-ups</h4>
            {customer.follow_ups.filter((f: any) => f.status === "PENDING").slice(0, 3).map((f: any) => (
              <div key={f.id} className="py-2 border-b border-white/5 last:border-0">
                <p className="text-white/80 font-bold">{f.reason}</p>
                <p className="text-[10px] text-white/40">{fmtDate(f.follow_up_date)} • {f.assigned_to || "Unassigned"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Activity Timeline */}
      <div className="lg:col-span-2">
        <div className="bg-[#111111] border border-white/10 p-5">
          <h4 className="text-gold-light uppercase tracking-widest text-[10px] font-bold mb-4">Customer Activity Timeline</h4>
          {timeline.length === 0 ? (
            <p className="text-white/40 text-center py-8">No activity yet.</p>
          ) : (
            <div className="space-y-0">
              {timeline.slice(0, 20).map((item, idx) => (
                <div key={idx} className="flex gap-4 py-3 border-b border-white/5 last:border-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{
                    background: item.type === "invoice" ? "rgba(212,175,55,0.15)" : item.type === "payment" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)",
                  }}>
                    {item.type === "invoice" ? "🧾" : item.type === "payment" ? "💰" : "📨"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 font-bold truncate">{item.label}</p>
                    <p className="text-[10px] text-white/50">{item.detail}</p>
                  </div>
                  <span className="text-[10px] text-white/30 shrink-0">{fmtDateTime(item.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BILLS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
function BillsTab({ invoices, fmtCur, fmtDate, onSendReminder, onRecordPayment }: any) {
  return (
    <div className="bg-[#111111] border border-white/10 shadow-xl overflow-x-auto">
      <table className="w-full text-left min-w-[800px]">
        <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[10px] border-b border-white/10">
          <tr>
            <th className="py-3 px-5">Invoice No</th>
            <th className="py-3 px-5">Date</th>
            <th className="py-3 px-5">Products</th>
            <th className="py-3 px-5 text-right">Total</th>
            <th className="py-3 px-5 text-right">Paid</th>
            <th className="py-3 px-5 text-right">Outstanding</th>
            <th className="py-3 px-5 text-center">Status</th>
            <th className="py-3 px-5 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {invoices.map((inv: any) => {
            const outstanding = Number(inv.grand_total) - Number(inv.amount_paid || 0);
            return (
              <tr key={inv.id} className="hover:bg-[#161616]">
                <td className="py-3 px-5 font-mono font-medium text-white text-[11px]">{inv.invoice_number}</td>
                <td className="py-3 px-5 text-white/60">{fmtDate(inv.created_at)}</td>
                <td className="py-3 px-5 text-white/70">
                  {(inv.items || []).map((it: any) => it.product_name).join(", ").substring(0, 50)}
                  {(inv.items || []).map((it: any) => it.product_name).join(", ").length > 50 ? "..." : ""}
                </td>
                <td className="py-3 px-5 text-right font-serif text-sm text-gold font-bold">{fmtCur(Number(inv.grand_total))}</td>
                <td className="py-3 px-5 text-right text-green-400">{fmtCur(Number(inv.amount_paid || 0))}</td>
                <td className="py-3 px-5 text-right">
                  {outstanding > 0 ? <span className="text-amber-400 font-bold">{fmtCur(outstanding)}</span> : <span className="text-green-400/60">—</span>}
                </td>
                <td className="py-3 px-5 text-center"><StatusBadge status={inv.payment_status} /></td>
                <td className="py-3 px-5 text-center space-x-2">
                  <Link href={`/admin/billing/history?id=${inv.id}`} className="text-gold-light hover:text-white underline text-[10px]">View</Link>
                  {outstanding > 0 && (
                    <>
                      <button onClick={() => onSendReminder(inv)} className="text-blue-400 hover:text-blue-300 text-[10px] underline">Remind</button>
                      <button onClick={() => onRecordPayment(inv)} className="text-green-400 hover:text-green-300 text-[10px] underline">Pay</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {invoices.length === 0 && (
            <tr><td colSpan={8} className="py-12 text-center text-white/40">No invoices for this customer.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAYMENTS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
function PaymentsTab({ payments, fmtCur, fmtDateTime }: any) {
  return (
    <div className="bg-[#111111] border border-white/10 shadow-xl overflow-x-auto">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[10px] border-b border-white/10">
          <tr>
            <th className="py-3 px-5">Date</th>
            <th className="py-3 px-5 text-right">Amount</th>
            <th className="py-3 px-5">Method</th>
            <th className="py-3 px-5">Reference</th>
            <th className="py-3 px-5">Recorded By</th>
            <th className="py-3 px-5">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {payments.map((p: any) => (
            <tr key={p.id} className="hover:bg-[#161616]">
              <td className="py-3 px-5 text-white/60">{fmtDateTime(p.payment_date)}</td>
              <td className="py-3 px-5 text-right font-serif text-sm text-green-400 font-bold">{fmtCur(Number(p.amount))}</td>
              <td className="py-3 px-5 text-white/70">{p.payment_method}</td>
              <td className="py-3 px-5 text-white/50 font-mono">{p.reference_number || "—"}</td>
              <td className="py-3 px-5 text-white/50">{p.recorded_by || "—"}</td>
              <td className="py-3 px-5 text-white/40">{p.notes || "—"}</td>
            </tr>
          ))}
          {payments.length === 0 && (
            <tr><td colSpan={6} className="py-12 text-center text-white/40">No payments recorded.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MESSAGES TAB
   ═══════════════════════════════════════════════════════════════════════════ */
function MessagesTab({ messages, fmtDateTime }: any) {
  return (
    <div className="bg-[#111111] border border-white/10 shadow-xl">
      {messages.length === 0 ? (
        <div className="py-12 text-center text-white/40">No messages sent to this customer.</div>
      ) : (
        <div className="divide-y divide-white/5">
          {messages.map((m: any) => (
            <div key={m.id} className="p-5 hover:bg-[#161616]">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-white/90 font-bold capitalize">{(m.message_type || "").replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-white/50 mt-1">
                    {m.channel?.toUpperCase()} • Sent by {m.sent_by || "System"} • {m.delivery_status}
                  </p>
                </div>
                <span className="text-[10px] text-white/30 shrink-0">{fmtDateTime(m.created_at)}</span>
              </div>
              <p className="mt-3 text-white/60 text-[11px] whitespace-pre-line bg-[#0a0a0a] p-3 border border-white/5">
                {m.message_content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOLLOW-UPS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
function FollowUpsTab({ customerId, followUps, fmtDate, onRefresh }: any) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ follow_up_date: "", reason: "", assigned_to: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await billingFetch(`/admin/billing/customers/${customerId}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ follow_up_date: "", reason: "", assigned_to: "", notes: "" });
      onRefresh();
    } catch { /* */ } finally { setSaving(false); }
  };

  const handleComplete = async (id: string) => {
    await billingFetch(`/admin/billing/customers/${customerId}/follow-ups`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "COMPLETED" }),
    });
    onRefresh();
  };

  const inp = "w-full bg-[#181818] border border-white/20 p-2.5 text-white focus:border-gold outline-none text-xs";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-display text-lg text-white">Follow-ups</h4>
        <button onClick={() => setShowForm(!showForm)} className="bg-gold hover:bg-gold-light text-[#070707] px-4 py-1.5 text-xs uppercase tracking-widest font-bold">
          + Add Follow-up
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#111111] border border-white/10 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Date *</label>
              <input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} className={inp} required />
            </div>
            <div>
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Assigned To</label>
              <input type="text" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className={inp} placeholder="Staff name" />
            </div>
            <div className="col-span-2">
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Reason *</label>
              <input type="text" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={inp} required placeholder="e.g. Call customer about pending payment" />
            </div>
            <div className="col-span-2">
              <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inp} rows={2} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-white/20 text-white/70 text-xs uppercase tracking-wider">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gold text-[#070707] text-xs uppercase tracking-widest font-bold disabled:opacity-50">
              {saving ? "Saving..." : "Create Follow-up"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-[#111111] border border-white/10 shadow-xl divide-y divide-white/5">
        {followUps.length === 0 ? (
          <div className="py-12 text-center text-white/40">No follow-ups yet.</div>
        ) : followUps.map((f: any) => (
          <div key={f.id} className="p-5 flex justify-between items-start gap-4">
            <div>
              <p className="text-white/90 font-bold">{f.reason}</p>
              <p className="text-[10px] text-white/50 mt-1">
                {fmtDate(f.follow_up_date)} • Assigned to: {f.assigned_to || "Unassigned"}
              </p>
              {f.notes && <p className="text-[10px] text-white/40 mt-1">{f.notes}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <FollowUpStatusBadge status={f.status} />
              {f.status === "PENDING" && (
                <button onClick={() => handleComplete(f.id)} className="text-[10px] text-green-400 hover:text-green-300 underline">
                  Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOTES TAB
   ═══════════════════════════════════════════════════════════════════════════ */
function NotesTab({ customerId, notes, fmtDateTime, onRefresh }: any) {
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await billingFetch(`/admin/billing/customers/${customerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote, created_by: getAdminUser() || "Admin" }),
      });
      setNewNote("");
      onRefresh();
    } catch { /* */ } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-[#111111] border border-white/10 p-5 flex gap-3">
        <input
          type="text"
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Add a note about this customer..."
          className="flex-1 bg-[#181818] border border-white/20 p-2.5 text-white focus:border-gold outline-none text-xs"
        />
        <button type="submit" disabled={saving || !newNote.trim()} className="bg-gold hover:bg-gold-light text-[#070707] px-6 py-2 text-xs uppercase tracking-widest font-bold disabled:opacity-50">
          {saving ? "Saving..." : "Add Note"}
        </button>
      </form>

      <div className="bg-[#111111] border border-white/10 shadow-xl divide-y divide-white/5">
        {notes.length === 0 ? (
          <div className="py-12 text-center text-white/40">No notes yet.</div>
        ) : notes.map((n: any) => (
          <div key={n.id} className="p-5">
            <p className="text-white/80">{n.note}</p>
            <p className="text-[10px] text-white/30 mt-2">
              {n.created_by || "Admin"} • {fmtDateTime(n.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAYMENT REMINDER MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
function ReminderModal({ customer, invoice, fmtCur, onClose, onSent }: any) {
  const [channel, setChannel] = useState("whatsapp");
  const [sending, setSending] = useState(false);

  const outstanding = Number(invoice.grand_total) - Number(invoice.amount_paid || 0);
  const message = `Dear ${customer.name},\n\nThis is a friendly payment reminder from Tirupati Jewellers.\n\nInvoice: ${invoice.invoice_number}\nOutstanding Amount: ${fmtCur(outstanding)}\n\nPlease complete your payment at your earliest convenience.\n\nThank you,\nTirupati Jewellers`;

  const handleSend = async () => {
    setSending(true);
    try {
      // Log the message
      await billingFetch(`/admin/billing/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          invoice_id: invoice.id,
          channel,
          message_type: "payment_reminder",
          message_content: message,
          sent_by: getAdminUser() || "Admin",
          delivery_status: channel === "whatsapp" ? "sent_via_link" : "pending_provider",
        }),
      });

      // Open WhatsApp link if whatsapp channel
      if (channel === "whatsapp" && customer.mobile) {
        const phone = customer.mobile.replace(/[^0-9]/g, "");
        const waUrl = `https://wa.me/${phone.startsWith("91") ? phone : "91" + phone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
      }

      onSent();
    } catch { /* */ } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-white/10 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-display text-xl text-white">Send Payment Reminder</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white text-lg">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Customer" value={customer.name} />
            <InfoRow label="Invoice" value={invoice.invoice_number} />
            <InfoRow label="Outstanding" value={fmtCur(outstanding)} />
          </div>

          <div>
            <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Channel</label>
            <div className="flex gap-3">
              {["whatsapp", "sms", "email"].map(ch => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`px-4 py-2 border text-xs uppercase tracking-wider font-bold ${
                    channel === ch ? "border-gold text-gold bg-gold/10" : "border-white/20 text-white/50"
                  }`}
                >
                  {ch === "whatsapp" ? "WhatsApp" : ch === "sms" ? "SMS" : "Email"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Message Preview</label>
            <pre className="bg-[#0a0a0a] border border-white/10 p-4 text-white/70 text-[11px] whitespace-pre-wrap">{message}</pre>
          </div>

          {channel !== "whatsapp" && (
            <div className="p-3 bg-amber-950/40 border border-amber-700/30 text-amber-200 text-[10px]">
              ⚠ {channel === "sms" ? "SMS" : "Email"} provider not configured. Message will be recorded but not automatically sent.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 border border-white/20 text-white/70 uppercase tracking-wider text-xs font-bold">Cancel</button>
            <button onClick={handleSend} disabled={sending} className="flex-1 py-3 bg-gold hover:bg-gold-light text-[#070707] uppercase tracking-widest text-xs font-bold disabled:opacity-50">
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECORD PAYMENT MODAL
   ═══════════════════════════════════════════════════════════════════════════ */
function RecordPaymentModal({ customer, invoice, fmtCur, onClose, onRecorded }: any) {
  const outstanding = Number(invoice.grand_total) - Number(invoice.amount_paid || 0);
  const [amount, setAmount] = useState(outstanding);
  const [method, setMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
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
      const res = await billingFetch(`/admin/billing/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: invoice.id,
          customer_id: customer.id,
          amount,
          payment_method: method,
          reference_number: reference || null,
          recorded_by: getAdminUser() || "Admin",
          notes: notes || null,
        }),
      });
      if (res.ok) {
        onRecorded();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to record payment.");
      }
    } catch {
      setError("Failed to connect to backend.");
    } finally { setSaving(false); }
  };

  const inp = "w-full bg-[#181818] border border-white/20 p-2.5 text-white focus:border-gold outline-none text-xs";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-white/10 shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-display text-xl text-white">Record Payment</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white text-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-red-400 text-[11px]">✕ {error}</p>}

          <div className="bg-[#0a0a0a] border border-white/10 p-4 space-y-1">
            <InfoRow label="Invoice" value={invoice.invoice_number} />
            <InfoRow label="Grand Total" value={fmtCur(Number(invoice.grand_total))} />
            <InfoRow label="Already Paid" value={fmtCur(Number(invoice.amount_paid || 0))} />
            <InfoRow label="Outstanding" value={fmtCur(outstanding)} />
          </div>

          <div>
            <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Payment Amount *</label>
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
            <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Reference No.</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)} className={inp} placeholder="Transaction ID / Cheque No." />
          </div>
          <div>
            <label className="block text-gold-light/80 mb-1 uppercase tracking-wider text-[10px] font-semibold">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className={inp} />
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

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */
function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gold-light/70 font-semibold">{label}</p>
      <p className={`font-display text-lg font-bold ${color || "text-white"}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-white/40 text-[10px] uppercase tracking-wider">{label}</span>
      <span className="text-white/80 font-medium">{value || "—"}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ESTIMATES TAB
   ═══════════════════════════════════════════════════════════════════════════ */
function EstimatesTab({ estimates, fmtCur, fmtDate }: any) {
  return (
    <div className="bg-[#111111] border border-white/10 shadow-xl overflow-x-auto">
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h4 className="font-display text-white">Estimates</h4>
        <Link href="/admin/billing/estimates/create" className="bg-gold hover:bg-gold-light text-[#070707] px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold">
          + Create Estimate
        </Link>
      </div>
      <table className="w-full text-left min-w-[800px]">
        <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[10px] border-b border-white/10">
          <tr>
            <th className="py-3 px-5">Estimate No</th>
            <th className="py-3 px-5">Date</th>
            <th className="py-3 px-5">Valid Until</th>
            <th className="py-3 px-5 text-right">Total</th>
            <th className="py-3 px-5 text-center">Status</th>
            <th className="py-3 px-5 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {estimates.map((est: any) => (
            <tr key={est.id} className="hover:bg-[#161616]">
              <td className="py-3 px-5 font-mono font-medium text-white text-[11px]">{est.estimate_number}</td>
              <td className="py-3 px-5 text-white/60">{fmtDate(est.created_at)}</td>
              <td className="py-3 px-5 text-white/60">{fmtDate(est.valid_until)}</td>
              <td className="py-3 px-5 text-right font-serif text-sm text-gold font-bold">{fmtCur(Number(est.grand_total))}</td>
              <td className="py-3 px-5 text-center">
                <span className={`px-2 py-1 text-[9px] uppercase tracking-wider font-bold ${
                  est.status === 'CONVERTED' ? 'bg-green-900/50 text-green-400' :
                  est.status === 'DRAFT' ? 'bg-gray-800 text-gray-300' :
                  est.status === 'ISSUED' ? 'bg-blue-900/50 text-blue-400' :
                  'bg-red-900/50 text-red-400'
                }`}>
                  {est.status}
                </span>
              </td>
              <td className="py-3 px-5 text-center">
                <Link href={`/admin/billing/estimates/${est.id}`} className="text-gold-light hover:text-white underline text-[10px]">View</Link>
              </td>
            </tr>
          ))}
          {estimates.length === 0 && (
            <tr><td colSpan={6} className="py-12 text-center text-white/40">No estimates for this customer.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GREETINGS TAB
   ═══════════════════════════════════════════════════════════════════════════ */
function GreetingsTab({ customer, greetings, fmtDateTime, onRefresh }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-display text-lg text-white">Automated Greetings</h4>
      </div>
      <div className="bg-[#161616] border border-white/10 p-4 rounded-sm flex gap-6 text-sm">
        <div>
          <span className="text-white/50 block text-[10px] uppercase tracking-wider mb-1">Birthday</span>
          <span className="text-white">{customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString() : 'Not set'}</span>
        </div>
        <div>
          <span className="text-white/50 block text-[10px] uppercase tracking-wider mb-1">Anniversary</span>
          <span className="text-white">{customer.anniversary_date ? new Date(customer.anniversary_date).toLocaleDateString() : 'Not set'}</span>
        </div>
        <div>
          <span className="text-white/50 block text-[10px] uppercase tracking-wider mb-1">Opt-In Status</span>
          <span className={customer.greeting_opt_in ? "text-green-400" : "text-red-400"}>
            {customer.greeting_opt_in ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      <div className="bg-[#111111] border border-white/10 shadow-xl">
        {greetings.length === 0 ? (
          <div className="py-12 text-center text-white/40">No greetings sent to this customer.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {greetings.map((m: any) => (
              <div key={m.id} className="p-5 hover:bg-[#161616]">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-white/90 font-bold">{m.occasion_name}</p>
                    <p className="text-[10px] text-white/50 mt-1">
                      {m.channel?.toUpperCase()} • {m.status}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/30 shrink-0">{m.sent_at ? fmtDateTime(m.sent_at) : 'Not sent'}</span>
                </div>
                <p className="mt-3 text-white/60 text-[11px] whitespace-pre-line bg-[#0a0a0a] p-3 border border-white/5">
                  {m.rendered_message}
                </p>
                {m.error_message && (
                  <p className="mt-2 text-red-400 text-[10px]">Error: {m.error_message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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

function FollowUpStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-900/40 text-amber-300 border-amber-800/50",
    COMPLETED: "bg-green-900/40 text-green-400 border-green-800/50",
    CANCELLED: "bg-red-900/40 text-red-300 border-red-800/50",
  };
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 border tracking-wider uppercase ${map[status] || "bg-white/10 text-white/60 border-white/20"}`}>
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ACTIVITY TAB
   ═══════════════════════════════════════════════════════════════════════════ */
function ActivityTab({ customerId }: { customerId: string }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, [customerId]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await billingFetch(`/admin/customers/${customerId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error("Failed to load activity", err);
    } finally {
      setLoading(false);
    }
  };

  const fmtDateTime = (d: string) => new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  if (loading) {
    return <div className="p-10 text-center text-white/40">Loading activity...</div>;
  }

  return (
    <div className="bg-[#111111] border border-white/10 shadow-xl p-5">
      <h4 className="text-gold-light uppercase tracking-widest text-[10px] font-bold mb-4 flex items-center gap-2">
        <span>🌐</span> Website Activity Timeline
      </h4>
      {activities.length === 0 ? (
        <div className="py-12 text-center text-white/40">
          <p>No website activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {activities.map((act) => {
            let icon = "🌐";
            let color = "rgba(255,255,255,0.1)";
            
            switch (act.event_type) {
              case "PAGE_VIEW":
                icon = "👁️"; break;
              case "PRODUCT_VIEW":
                icon = "💍"; color = "rgba(212,175,55,0.15)"; break;
              case "ADD_TO_CART":
                icon = "🛍️"; color = "rgba(34,197,94,0.15)"; break;
              case "CHECKOUT_STARTED":
                icon = "💳"; color = "rgba(59,130,246,0.15)"; break;
              case "ORDER_PLACED":
                icon = "✅"; color = "rgba(34,197,94,0.3)"; break;
            }

            return (
              <div key={act.id} className="flex gap-4 py-4 border-b border-white/5 last:border-0 hover:bg-[#161616] -mx-5 px-5 transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border border-white/5" style={{ background: color }}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <p className="text-white/90 font-bold capitalize text-sm">{act.event_type.replace(/_/g, " ")}</p>
                    <span className="text-[10px] text-white/30 shrink-0 ml-4 font-mono">{fmtDateTime(act.created_at)}</span>
                  </div>
                  
                  {act.page_path && (
                    <p className="text-[11px] text-white/50 mt-1 font-mono">
                      <span className="text-white/30 mr-2">Path:</span> {act.page_path}
                    </p>
                  )}
                  {act.product_id && (
                    <p className="text-[11px] text-gold/70 mt-1">
                      <span className="text-white/30 mr-2">Product:</span> {act.product_id}
                    </p>
                  )}
                  {act.metadata && Object.keys(act.metadata).length > 0 && (
                    <div className="mt-2 text-[10px] text-white/40 bg-[#0a0a0a] border border-white/5 p-2 font-mono break-all">
                      {JSON.stringify(act.metadata)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
