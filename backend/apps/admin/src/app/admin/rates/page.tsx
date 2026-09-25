"use client";

import React, { useState, useEffect } from "react";

const MEDUSA_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

interface MetalRate {
  id: string;
  metal: string;
  purity_code: string;
  rate_per_gram: string;
  effective_from: string;
  is_current: boolean;
  created_by?: string;
  notes?: string;
  source_type?: string;
  provider?: string;
  rate_derivation?: string;
  override_reason?: string;
}

interface ProviderStatus {
  provider: string | null;
  display_name: string | null;
  source_type: string | null;
  is_available: boolean;
  is_configured: boolean;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_error: string | null;
  quotes_persisted: number;
  config: {
    refresh_interval_minutes: number;
    max_staleness_minutes: number;
  };
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return new Date(dateStr).toLocaleString("en-IN");
}

export default function MetalRatesPage() {
  const [rates, setRates] = useState<MetalRate[]>([]);
  const [history, setHistory] = useState<MetalRate[]>([]);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOverride, setShowOverride] = useState(false);

  const [formData, setFormData] = useState({
    metal: "GOLD",
    purity_code: "22K",
    rate_per_gram: "",
    effective_from: "",
    notes: "",
    override_reason: ""
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [currentRes, historyRes, statusRes] = await Promise.all([
        fetch(`${MEDUSA_URL}/admin/rates/current`),
        fetch(`${MEDUSA_URL}/admin/rates/history?limit=30`),
        fetch(`${MEDUSA_URL}/admin/rates/provider-status`),
      ]);

      if (currentRes.ok) setRates((await currentRes.json()).rates || []);
      if (historyRes.ok) setHistory((await historyRes.json()).rates || []);
      if (statusRes.ok) setStatus(await statusRes.json());
    } catch (err) {
      console.error("Failed to fetch rates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const effective_from = formData.effective_from
      ? new Date(formData.effective_from).toISOString()
      : new Date().toISOString();

    try {
      const res = await fetch(`${MEDUSA_URL}/admin/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, effective_from }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save rate");
      setFormData({ ...formData, rate_per_gram: "", effective_from: "", notes: "", override_reason: "" });
      setShowOverride(false);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Determine overall status
  const getProviderStatusUI = () => {
    if (!status?.is_configured) {
      return { label: "NOT CONFIGURED", color: "text-yellow-400", dot: "bg-yellow-400", bg: "border-yellow-500/30 bg-yellow-500/5" };
    }
    if (status.is_available && status.last_success_at) {
      const mins = (Date.now() - new Date(status.last_success_at).getTime()) / 60000;
      if (mins <= (status.config?.max_staleness_minutes || 60)) {
        return { label: "LIVE", color: "text-green-400", dot: "bg-green-400 animate-pulse", bg: "border-green-500/30 bg-green-500/5" };
      }
      return { label: "STALE", color: "text-amber-400", dot: "bg-amber-400", bg: "border-amber-500/30 bg-amber-500/5" };
    }
    if (status.last_error) {
      return { label: "UNAVAILABLE", color: "text-red-400", dot: "bg-red-400", bg: "border-red-500/30 bg-red-500/5" };
    }
    return { label: "PENDING", color: "text-white/50", dot: "bg-white/50", bg: "border-white/10 bg-white/5" };
  };

  const silverRate = rates.find(r => r.metal === "SILVER" && r.purity_code === "999");
  const provUI = getProviderStatusUI();

  if (loading && rates.length === 0) {
    return <div className="min-h-screen bg-[#070707] flex items-center justify-center text-white text-xs">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="font-sans text-2xl tracking-[0.2em] uppercase font-bold text-gold mb-2">Metal Rates</h1>
          <p className="text-white/50 text-xs tracking-widest uppercase">Automatic Market Rate System</p>
        </div>

        {/* Provider Status Banner */}
        <div className={`border p-5 flex flex-wrap items-center justify-between gap-4 ${provUI.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${provUI.dot}`} />
            <span className={`text-sm font-bold uppercase tracking-widest ${provUI.color}`}>{provUI.label}</span>
            {status?.display_name && (
              <span className="text-white/40 text-xs ml-2">
                {status.display_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-6 text-[10px] text-white/50 uppercase tracking-widest">
            {status?.last_success_at && (
              <span>Last Update: <span className="text-white/70">{timeAgo(status.last_success_at)}</span></span>
            )}
            {status?.config && (
              <span>Refresh: <span className="text-white/70">Every {status.config.refresh_interval_minutes} min</span></span>
            )}
            {status?.source_type && (
              <span>Source: <span className="text-white/70">{status.source_type.replace(/_/g, " ")}</span></span>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {status?.last_error && status.last_error !== "PROVIDER_NOT_CONFIGURED" && (
          <div className="border border-red-500/30 bg-red-500/5 p-4 text-red-400 text-xs">
            <strong>⚠ Provider Error:</strong> {status.last_error}
            {status.last_failure_at && (
              <span className="text-red-400/50 ml-3">({timeAgo(status.last_failure_at)})</span>
            )}
          </div>
        )}

        {!status?.is_configured && (
          <div className="border border-yellow-500/30 bg-yellow-500/5 p-5">
            <p className="text-yellow-400 font-bold text-sm mb-2">⚠ AUTOMATIC MARKET RATE PROVIDER NOT CONFIGURED</p>
            <p className="text-yellow-400/70 text-xs">
              Set <code className="bg-black px-1 py-0.5 text-yellow-300">METAL_RATE_PROVIDER=goldapi</code> and{" "}
              <code className="bg-black px-1 py-0.5 text-yellow-300">METAL_RATE_API_KEY=your_key</code> in your{" "}
              <code className="bg-black px-1 py-0.5 text-yellow-300">.env</code> file.
            </p>
            <p className="text-yellow-400/50 text-[10px] mt-2">Get your API key from https://www.goldapi.io/</p>
          </div>
        )}

        {/* Current Gold Rates */}
        <div>
          <h2 className="font-sans text-xs tracking-[0.25em] uppercase font-bold text-white/60 mb-4">Gold</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["24K", "22K", "18K", "14K"].map(purity => {
              const current = rates.find(r => r.metal === "GOLD" && r.purity_code === purity);
              return (
                <div key={purity} className="bg-[#141414] border border-gold/20 p-6 flex flex-col items-center justify-center space-y-3">
                  <span className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Gold {purity}</span>
                  <span className="text-gold text-2xl font-bold tracking-wider">
                    {current ? `₹${Number(current.rate_per_gram).toLocaleString('en-IN')}` : "—"}
                  </span>
                  <span className="text-white/30 text-[9px] uppercase tracking-widest">per gram</span>
                  {current?.source_type && (
                    <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 border ${
                      current.source_type === "AUTOMATIC"
                        ? "border-green-500/30 text-green-400 bg-green-500/10"
                        : current.source_type === "MANUAL_OVERRIDE"
                        ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        : "border-white/10 text-white/40"
                    }`}>
                      {current.source_type === "AUTOMATIC" ? "AUTO" : current.source_type === "MANUAL_OVERRIDE" ? "OVERRIDE" : "MANUAL"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Silver Rate */}
        <div>
          <h2 className="font-sans text-xs tracking-[0.25em] uppercase font-bold text-white/60 mb-4">Silver</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#141414] border border-white/10 p-6 flex flex-col items-center justify-center space-y-3">
              <span className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Silver 999</span>
              <span className="text-white text-2xl font-bold tracking-wider">
                {silverRate ? `₹${Number(silverRate.rate_per_gram).toLocaleString('en-IN')}` : "—"}
              </span>
              <span className="text-white/30 text-[9px] uppercase tracking-widest">per gram</span>
              {silverRate?.source_type && (
                <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 border ${
                  silverRate.source_type === "AUTOMATIC"
                    ? "border-green-500/30 text-green-400 bg-green-500/10"
                    : "border-white/10 text-white/40"
                }`}>
                  {silverRate.source_type === "AUTOMATIC" ? "AUTO" : silverRate.source_type === "MANUAL_OVERRIDE" ? "OVERRIDE" : "MANUAL"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Manual Override (collapsed by default) */}
        <div className="border border-red-500/20 bg-red-500/5">
          <button
            onClick={() => setShowOverride(!showOverride)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span className="text-red-400 text-[11px] uppercase tracking-widest font-bold">
              ⚠ Emergency Manual Override
            </span>
            <span className="text-red-400/50 text-xs">{showOverride ? "▲ Close" : "▼ Expand"}</span>
          </button>

          {showOverride && (
            <div className="p-6 pt-0 border-t border-red-500/10">
              <p className="text-red-400/60 text-[10px] mb-4 uppercase tracking-wider">
                Use this only when automatic market data is unavailable or incorrect. Requires <code className="bg-black px-1">gold_rates.manage</code> permission.
              </p>

              {error && (
                <div className="mb-4 p-3 border border-red-500/50 bg-red-500/10 text-red-500 text-xs">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1">Metal</label>
                    <select
                      value={formData.metal}
                      onChange={e => setFormData({...formData, metal: e.target.value})}
                      className="w-full bg-[#070707] border border-white/10 p-2.5 text-xs focus:border-red-500/50 outline-none"
                    >
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1">Purity</label>
                    <select
                      value={formData.purity_code}
                      onChange={e => setFormData({...formData, purity_code: e.target.value})}
                      className="w-full bg-[#070707] border border-white/10 p-2.5 text-xs focus:border-red-500/50 outline-none"
                    >
                      {formData.metal === "GOLD" ? (
                        <>
                          <option value="24K">24K</option>
                          <option value="22K">22K</option>
                          <option value="18K">18K</option>
                          <option value="14K">14K</option>
                        </>
                      ) : (
                        <>
                          <option value="999">999</option>
                          <option value="925">925</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1">Rate per Gram (₹)</label>
                    <input
                      type="number" step="0.01" required
                      value={formData.rate_per_gram}
                      onChange={e => setFormData({...formData, rate_per_gram: e.target.value})}
                      className="w-full bg-[#070707] border border-white/10 p-2.5 text-xs focus:border-red-500/50 outline-none"
                      placeholder="e.g. 7450"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1">Effective From</label>
                    <input
                      type="datetime-local"
                      value={formData.effective_from}
                      onChange={e => setFormData({...formData, effective_from: e.target.value})}
                      className="w-full bg-[#070707] border border-white/10 p-2.5 text-xs focus:border-red-500/50 outline-none"
                    />
                    <span className="block mt-0.5 text-[9px] text-white/30">Leave empty for immediate</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-white/50 uppercase tracking-widest mb-1">Override Reason (Required)</label>
                  <input
                    type="text" required
                    value={formData.override_reason}
                    onChange={e => setFormData({...formData, override_reason: e.target.value})}
                    className="w-full bg-[#070707] border border-white/10 p-2.5 text-xs focus:border-red-500/50 outline-none"
                    placeholder="e.g. Provider unavailable, using IBJA morning rate"
                  />
                </div>
                <button
                  type="submit" disabled={saving}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Submit Manual Override"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Rate History */}
        <div>
          <h2 className="font-sans text-xs tracking-[0.25em] uppercase font-bold text-white/60 mb-4">Rate History</h2>
          <div className="bg-[#141414] border border-gold/20 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gold/20 bg-[#070707]">
                <tr>
                  <th className="p-4 uppercase tracking-widest text-white/50 font-normal">Metal</th>
                  <th className="p-4 uppercase tracking-widest text-white/50 font-normal">Purity</th>
                  <th className="p-4 uppercase tracking-widest text-white/50 font-normal">Rate (/g)</th>
                  <th className="p-4 uppercase tracking-widest text-white/50 font-normal">Effective From</th>
                  <th className="p-4 uppercase tracking-widest text-white/50 font-normal">Source</th>
                  <th className="p-4 uppercase tracking-widest text-white/50 font-normal">Status</th>
                  <th className="p-4 uppercase tracking-widest text-white/50 font-normal">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {history.map((record) => {
                  const sourceType = (record as any).source_type || "MANUAL";
                  return (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold">{record.metal}</td>
                      <td className="p-4">{record.purity_code}</td>
                      <td className="p-4 text-gold font-bold">₹{Number(record.rate_per_gram).toLocaleString('en-IN')}</td>
                      <td className="p-4">{new Date(record.effective_from).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                          sourceType === "AUTOMATIC"
                            ? "border-green-500/30 text-green-400 bg-green-500/10"
                            : sourceType === "MANUAL_OVERRIDE"
                            ? "border-red-500/30 text-red-400 bg-red-500/10"
                            : "border-white/10 text-white/40"
                        }`}>
                          {sourceType === "AUTOMATIC" ? "AUTO" : sourceType === "MANUAL_OVERRIDE" ? "OVERRIDE" : "MANUAL"}
                        </span>
                      </td>
                      <td className="p-4">
                        {new Date(record.effective_from) > new Date() ? (
                          <span className="text-blue-500 text-[10px] uppercase tracking-widest border border-blue-500/30 px-2 py-1 bg-blue-500/10">Scheduled</span>
                        ) : (
                          <span className="text-white/30 text-[10px] uppercase tracking-widest">—</span>
                        )}
                      </td>
                      <td className="p-4 text-white/50 truncate max-w-xs">{record.notes || (record as any).override_reason || "-"}</td>
                    </tr>
                  );
                })}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-white/50">No rate history found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
