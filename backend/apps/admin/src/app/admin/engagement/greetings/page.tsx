"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";


export default function GreetingsDashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/medusa/admin/billing/greetings/history");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT": return "text-green-400 bg-green-900/50";
      case "FAILED": return "text-red-400 bg-red-900/50";
      case "SCHEDULED": return "text-blue-400 bg-blue-900/50";
      case "PENDING": return "text-yellow-400 bg-yellow-900/50";
      default: return "text-gray-400 bg-gray-800";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-display text-white mb-2">Greetings Dashboard</h1>
        <p className="text-sm text-white/50">Manage and monitor automated customer greetings</p>
      </div>

      <div className="mt-8 bg-[#111111] border border-gold/20 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#161616] text-gold text-[10px] uppercase tracking-widest font-sans border-b border-gold/10">
              <tr>
                <th className="py-4 px-6 font-bold">Date</th>
                <th className="py-4 px-6 font-bold">Customer</th>
                <th className="py-4 px-6 font-bold">Occasion</th>
                <th className="py-4 px-6 font-bold">Type</th>
                <th className="py-4 px-6 font-bold">Channel</th>
                <th className="py-4 px-6 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-white/50">Loading...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-white/50">No greetings history found.</td></tr>
              ) : history.map((item: any) => (
                <tr key={item.id} className="hover:bg-[#161616] transition-colors group">
                  <td className="py-4 px-6 text-white/70">
                    {format(new Date(item.created_at), "dd MMM yyyy, HH:mm")}
                  </td>
                  <td className="py-4 px-6 font-medium text-white">
                    {item.customer?.name || "Unknown"}
                    <span className="block text-[10px] text-white/40">{item.customer?.mobile}</span>
                  </td>
                  <td className="py-4 px-6 text-white/80">{item.occasion_name}</td>
                  <td className="py-4 px-6 text-white/60">{item.occasion_type}</td>
                  <td className="py-4 px-6 uppercase text-[10px] tracking-wider text-white/50">{item.channel}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
