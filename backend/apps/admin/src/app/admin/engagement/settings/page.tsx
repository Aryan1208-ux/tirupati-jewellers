"use client";

import React, { useEffect, useState } from "react";


export default function GreetingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    automation_enabled: false,
    automatic_birthdays: false,
    automatic_anniversaries: false,
    automatic_festivals: false,
    automatic_post_purchase: false,
    post_purchase_delay_days: 2,
    test_mode: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/medusa/admin/billing/greetings/settings");
      const data = await res.json();
      if (data.settings) {
        setFormData(data.settings);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/medusa/admin/billing/greetings/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("Settings saved successfully.");
      } else {
        alert("Failed to save settings.");
      }
    } catch (e) {
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white/50 text-center">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-display text-white mb-2">Greeting Settings</h1>
          <p className="text-sm text-white/50">Configure automated customer engagement rules</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-gold hover:bg-gold-light text-[#070707] px-8 py-3 text-xs uppercase tracking-widest font-bold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="bg-[#111111] border border-gold/20 shadow-2xl p-8 space-y-12">
        
        <section>
          <div className="flex items-center gap-4 mb-6 pb-2 border-b border-white/10">
            <h3 className="text-lg font-display text-white">Master Switch</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={formData.automation_enabled} onChange={e => setFormData({...formData, automation_enabled: e.target.checked})} />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          <p className="text-sm text-white/50">
            When disabled, no automated greetings will be sent by the system, regardless of the individual toggles below. Bill greetings on invoices will still work.
          </p>
        </section>

        <section className={`transition-opacity ${!formData.automation_enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-lg font-display text-white mb-6 pb-2 border-b border-white/10">Automated Triggers</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#161616] border border-white/5">
              <div>
                <h4 className="text-white font-bold mb-1">Birthday Greetings</h4>
                <p className="text-xs text-white/50">Automatically send greetings on customer birthdays at 9 AM.</p>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-gold" checked={formData.automatic_birthdays} onChange={e => setFormData({...formData, automatic_birthdays: e.target.checked})} />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#161616] border border-white/5">
              <div>
                <h4 className="text-white font-bold mb-1">Anniversary Greetings</h4>
                <p className="text-xs text-white/50">Automatically send greetings on customer anniversaries at 9 AM.</p>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-gold" checked={formData.automatic_anniversaries} onChange={e => setFormData({...formData, automatic_anniversaries: e.target.checked})} />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#161616] border border-white/5">
              <div>
                <h4 className="text-white font-bold mb-1">Festival Greetings</h4>
                <p className="text-xs text-white/50">Send mass greetings to all opted-in customers during active festivals.</p>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-gold" checked={formData.automatic_festivals} onChange={e => setFormData({...formData, automatic_festivals: e.target.checked})} />
            </div>

            <div className="flex items-center justify-between p-4 bg-[#161616] border border-white/5">
              <div>
                <h4 className="text-white font-bold mb-1">Post-Purchase Thank You</h4>
                <p className="text-xs text-white/50 mb-3">Send a follow-up greeting after an invoice is fully paid.</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">Delay:</span>
                  <input type="number" min="1" max="30" className="w-20 bg-black border border-white/20 px-2 py-1 text-white text-sm focus:border-gold outline-none" value={formData.post_purchase_delay_days} onChange={e => setFormData({...formData, post_purchase_delay_days: parseInt(e.target.value) || 2})} />
                  <span className="text-sm text-white/70">days after invoice date</span>
                </div>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-gold" checked={formData.automatic_post_purchase} onChange={e => setFormData({...formData, automatic_post_purchase: e.target.checked})} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-display text-white mb-6 pb-2 border-b border-white/10">Developer Settings</h3>
          <div className="flex items-center gap-4">
            <input type="checkbox" id="testmode" className="w-5 h-5 accent-red-500" checked={formData.test_mode} onChange={e => setFormData({...formData, test_mode: e.target.checked})} />
            <label htmlFor="testmode" className="text-red-400 font-bold">Enable Simulation Mode (Test Mode)</label>
          </div>
          <p className="text-xs text-white/50 mt-2 pl-9">
            When enabled, messages will be logged to the console but not actually sent via the communication provider (Twilio/WhatsApp).
          </p>
        </section>
      </div>
    </div>
  );
}
