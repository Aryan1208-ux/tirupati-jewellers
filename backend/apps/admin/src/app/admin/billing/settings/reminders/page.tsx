"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

export default function ReminderSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    enabled: false,
    preferred_channel: "whatsapp",
    schedule: [{ days: 1, type: "after" }, { days: 3, type: "after" }],
    max_reminders: 5,
    min_interval_hours: 24,
    communication_hours_start: 9,
    communication_hours_end: 20,
    payment_link_expiry_hours: 72,
    receipt_message_enabled: true,
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    // We would fetch existing settings here if the API existed
    // For now, this is a mock settings UI that demonstrates the intended configuration
    setLoading(false);
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Mock save
    setTimeout(() => {
      setSaving(false);
      setSuccess("Settings saved successfully.");
      setTimeout(() => setSuccess(""), 3000);
    }, 800);
  };

  const addScheduleRow = () => {
    setForm(prev => ({
      ...prev,
      schedule: [...prev.schedule, { days: 1, type: "after" }],
    }));
  };

  const removeScheduleRow = (index: number) => {
    setForm(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const updateScheduleRow = (index: number, key: string, value: string | number) => {
    setForm(prev => {
      const newSchedule = [...prev.schedule];
      newSchedule[index] = { ...newSchedule[index], [key]: value };
      return { ...prev, schedule: newSchedule };
    });
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex justify-center items-center text-white text-xs">Loading...</div>;

  const inp = "w-full bg-[#181818] border border-white/20 p-2.5 text-white focus:border-gold outline-none text-xs";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="bg-[#111111] border-b border-gold/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold">👑</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">TIRUPATI JEWELLERS</h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">AUTOMATED REMINDERS</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/billing/settings" className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider">← Settings</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-xs">
        {error && <div className="mb-6 p-4 bg-red-950/80 border border-red-500/60 text-red-200">✕ {error}</div>}
        {success && <div className="mb-6 p-4 bg-green-950/80 border border-green-500/60 text-green-200">✓ {success}</div>}

        <div className="mb-8 p-4 bg-amber-950/30 border border-amber-700/30 text-amber-200/70 text-[10px] leading-relaxed">
          <strong>⚠ Configuration Notice:</strong> Automatic messaging requires provider credentials (e.g., WhatsApp Business API, Twilio SMS, or SendGrid) to be configured in your Medusa backend environment. The scheduler job <code className="bg-amber-900/40 px-1">jobs/payment-reminders.ts</code> must also be active.
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          
          <section className="bg-[#111111] border border-white/10 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <h2 className="font-display text-xl text-white">Master Switch</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-gold-light uppercase tracking-widest text-[10px] font-bold">
                  {form.enabled ? "Enabled" : "Disabled"}
                </span>
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <input type="checkbox" className="sr-only" checked={form.enabled} onChange={e => setForm({...form, enabled: e.target.checked})} />
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Preferred Channel</label>
                <select value={form.preferred_channel} onChange={e => setForm({...form, preferred_channel: e.target.value})} className={inp}>
                  <option value="whatsapp">WhatsApp (Recommended)</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Send Payment Receipts</label>
                <select value={form.receipt_message_enabled ? "yes" : "no"} onChange={e => setForm({...form, receipt_message_enabled: e.target.value === "yes"})} className={inp}>
                  <option value="yes">Yes, send "Thank You" messages when fully paid</option>
                  <option value="no">No, only send reminders for pending amounts</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-[#111111] border border-white/10 p-6 shadow-2xl opacity-70 cursor-not-allowed">
            <h2 className="font-display text-xl text-white mb-6 pb-4 border-b border-white/10">Follow-up Schedule</h2>
            <div className="space-y-4 mb-6">
              {form.schedule.map((sch, i) => (
                <div key={i} className="flex items-center gap-4 bg-[#181818] p-3 border border-white/10">
                  <span className="text-white/50 text-[10px] w-6">#{i+1}</span>
                  <input type="number" min={0} value={sch.days} onChange={e => updateScheduleRow(i, "days", Number(e.target.value))} className={`${inp} w-20 text-center`} disabled />
                  <span className="text-white/50">Days</span>
                  <select value={sch.type} onChange={e => updateScheduleRow(i, "type", e.target.value)} className={`${inp} w-40`} disabled>
                    <option value="before">Before Due Date</option>
                    <option value="after">After Due Date</option>
                  </select>
                  <button type="button" onClick={() => removeScheduleRow(i)} className="text-red-400 hover:text-red-300 ml-auto" disabled>✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addScheduleRow} className="px-4 py-2 border border-dashed border-white/20 text-white/50 hover:text-white uppercase tracking-wider text-[10px] w-full" disabled>
              + Add Reminder Stage
            </button>
          </section>

          <section className="bg-[#111111] border border-white/10 p-6 shadow-2xl">
            <h2 className="font-display text-xl text-white mb-6 pb-4 border-b border-white/10">Delivery Constraints</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Communication Hours</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={23} value={form.communication_hours_start} onChange={e => setForm({...form, communication_hours_start: Number(e.target.value)})} className={inp} />
                  <span className="text-white/50">to</span>
                  <input type="number" min={0} max={23} value={form.communication_hours_end} onChange={e => setForm({...form, communication_hours_end: Number(e.target.value)})} className={inp} />
                </div>
                <p className="text-[10px] text-white/40 mt-1">Default 9 to 20 (9 AM - 8 PM). Messages won't send at night.</p>
              </div>
              <div>
                <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Payment Link Expiry (Hours)</label>
                <input type="number" min={1} value={form.payment_link_expiry_hours} onChange={e => setForm({...form, payment_link_expiry_hours: Number(e.target.value)})} className={inp} />
                <p className="text-[10px] text-white/40 mt-1">Default 72 hours. Links expire automatically.</p>
              </div>
              <div>
                <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Max Reminders Per Invoice</label>
                <input type="number" min={1} value={form.max_reminders} onChange={e => setForm({...form, max_reminders: Number(e.target.value)})} className={inp} />
              </div>
              <div>
                <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Minimum Interval Between Reminders (Hours)</label>
                <input type="number" min={1} value={form.min_interval_hours} onChange={e => setForm({...form, min_interval_hours: Number(e.target.value)})} className={inp} />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4">
            <button type="submit" disabled={saving} className="px-10 py-3 bg-gold hover:bg-gold-light text-[#070707] uppercase tracking-widest font-bold transition-colors disabled:opacity-50 shadow-xl">
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
