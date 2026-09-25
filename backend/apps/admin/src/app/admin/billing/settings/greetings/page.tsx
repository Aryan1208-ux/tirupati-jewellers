"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { billingFetch } from "@/lib/billing-api";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default function GreetingsSettingsPage() {
  const router = useRouter();
  const [occasions, setOccasions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [occasionForm, setOccasionForm] = useState({ name: "", occasion_date: "" });
  const [templateForm, setTemplateForm] = useState({ name: "", occasion_type: "FESTIVAL", channel: "whatsapp", message: "" });
  const [showOccasionForm, setShowOccasionForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [occRes, tmpRes] = await Promise.all([
        billingFetch("/admin/billing/greetings/occasions"),
        billingFetch("/admin/billing/greetings/templates")
      ]);
      if (occRes.ok) setOccasions((await occRes.json()).occasions);
      if (tmpRes.ok) setTemplates((await tmpRes.json()).templates);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOccasion = async (e: React.FormEvent) => {
    e.preventDefault();
    await billingFetch("/admin/billing/greetings/occasions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(occasionForm)
    });
    setOccasionForm({ name: "", occasion_date: "" });
    setShowOccasionForm(false);
    loadData();
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    await billingFetch("/admin/billing/greetings/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templateForm)
    });
    setTemplateForm({ name: "", occasion_type: "FESTIVAL", channel: "whatsapp", message: "" });
    setShowTemplateForm(false);
    loadData();
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-xs">Loading...</div>;

  const inp = "w-full bg-[#181818] border border-white/20 p-2.5 text-white focus:border-gold outline-none text-xs";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="bg-[#111111] border-b border-gold/30 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl tracking-[0.2em]">GREETING SETTINGS</h1>
          <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold mt-1">Configure automated messages</p>
        </div>
        <Link href="/admin/billing/settings" className="text-xs text-white/70 hover:text-gold uppercase tracking-wider">← Back</Link>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-12">
        {/* OCCASIONS */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl text-white">Festivals & Occasions</h2>
            <button onClick={() => setShowOccasionForm(!showOccasionForm)} className="bg-gold text-[#070707] px-4 py-2 text-xs uppercase tracking-widest font-bold">
              + Add Occasion
            </button>
          </div>

          {showOccasionForm && (
            <form onSubmit={handleCreateOccasion} className="bg-[#111111] border border-white/10 p-6 mb-6 flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Occasion Name</label>
                <input type="text" value={occasionForm.name} onChange={e => setOccasionForm({ ...occasionForm, name: e.target.value })} className={inp} required placeholder="e.g. Diwali 2026" />
              </div>
              <div className="flex-1">
                <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Date</label>
                <input type="date" value={occasionForm.occasion_date} onChange={e => setOccasionForm({ ...occasionForm, occasion_date: e.target.value })} className={inp} required />
              </div>
              <button type="submit" className="bg-gold text-[#070707] px-6 py-2.5 text-xs uppercase tracking-widest font-bold h-[41px]">Save</button>
            </form>
          )}

          <div className="bg-[#111111] border border-white/10 shadow-xl overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-5">Name</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {occasions.map((o: any) => (
                  <tr key={o.id} className="hover:bg-[#161616]">
                    <td className="py-3 px-5 text-white">{o.name}</td>
                    <td className="py-3 px-5 text-white/60">{new Date(o.occasion_date).toLocaleDateString()}</td>
                    <td className="py-3 px-5 text-green-400">{o.is_active ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* TEMPLATES */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl text-white">Message Templates</h2>
            <button onClick={() => setShowTemplateForm(!showTemplateForm)} className="bg-gold text-[#070707] px-4 py-2 text-xs uppercase tracking-widest font-bold">
              + Add Template
            </button>
          </div>

          {showTemplateForm && (
            <form onSubmit={handleCreateTemplate} className="bg-[#111111] border border-white/10 p-6 mb-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Template Name</label>
                  <input type="text" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} className={inp} required />
                </div>
                <div>
                  <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Occasion Type</label>
                  <select value={templateForm.occasion_type} onChange={e => setTemplateForm({ ...templateForm, occasion_type: e.target.value })} className={inp}>
                    <option value="FESTIVAL">Festival</option>
                    <option value="BIRTHDAY">Birthday</option>
                    <option value="ANNIVERSARY">Anniversary</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Channel</label>
                  <select value={templateForm.channel} onChange={e => setTemplateForm({ ...templateForm, channel: e.target.value })} className={inp}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gold-light/80 mb-2 uppercase tracking-wider text-[10px] font-semibold">Message (Variables: {"{{customer_name}}, {{occasion_name}}"})</label>
                <textarea rows={4} value={templateForm.message} onChange={e => setTemplateForm({ ...templateForm, message: e.target.value })} className={inp} required />
              </div>
              <button type="submit" className="bg-gold text-[#070707] px-6 py-2.5 text-xs uppercase tracking-widest font-bold">Save Template</button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((t: any) => (
              <div key={t.id} className="bg-[#111111] border border-white/10 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-gold font-bold">{t.name}</h3>
                    <p className="text-[10px] text-white/50">{t.occasion_type} • {t.channel.toUpperCase()}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-1 uppercase font-bold ${t.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <pre className="text-white/70 text-[11px] whitespace-pre-wrap bg-[#0a0a0a] p-3 border border-white/5">{t.message}</pre>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
