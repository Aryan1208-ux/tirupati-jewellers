"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";


export default function FestivalsPage() {
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    start_date: "",
    end_date: "",
    is_active: true,
    enable_on_bill: false,
    bill_greeting_text: ""
  });

  useEffect(() => {
    fetchOccasions();
  }, []);

  const fetchOccasions = async () => {
    try {
      const res = await fetch("/api/medusa/admin/billing/greetings/occasions");
      const data = await res.json();
      setOccasions(data.occasions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (occ: any) => {
    setFormData({
      id: occ.id,
      name: occ.name,
      start_date: occ.start_date.split("T")[0],
      end_date: occ.end_date.split("T")[0],
      is_active: occ.is_active,
      enable_on_bill: occ.enable_on_bill,
      bill_greeting_text: occ.bill_greeting_text || ""
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setFormData({
      id: "",
      name: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      is_active: true,
      enable_on_bill: false,
      bill_greeting_text: ""
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      
      let res;
      if (formData.id) {
        res = await fetch(`/api/medusa/admin/billing/greetings/occasions/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/medusa/admin/billing/greetings/occasions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      
      if (res.ok) {
        setShowModal(false);
        fetchOccasions();
      } else {
        alert("Failed to save festival.");
      }
    } catch (e) {
      alert("Error saving festival.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-display text-white mb-2">Festivals & Occasions</h1>
          <p className="text-sm text-white/50">Manage active festivals and invoice greetings</p>
        </div>
        <button 
          onClick={handleCreate}
          className="bg-gold hover:bg-gold-light text-[#070707] px-6 py-2 text-xs uppercase tracking-widest font-bold"
        >
          + Add Festival
        </button>
      </div>

      <div className="bg-[#111111] border border-gold/20 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#161616] text-gold text-[10px] uppercase tracking-widest font-sans border-b border-gold/10">
              <tr>
                <th className="py-4 px-6 font-bold">Name</th>
                <th className="py-4 px-6 font-bold">Date Range</th>
                <th className="py-4 px-6 font-bold">Status</th>
                <th className="py-4 px-6 font-bold">Bill Greeting</th>
                <th className="py-4 px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-white/50">Loading...</td></tr>
              ) : occasions.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-white/50">No festivals configured.</td></tr>
              ) : occasions.map((item: any) => (
                <tr key={item.id} className="hover:bg-[#161616] transition-colors">
                  <td className="py-4 px-6 font-medium text-white">{item.name}</td>
                  <td className="py-4 px-6 text-white/70">
                    {format(new Date(item.start_date), "dd MMM yy")} - {format(new Date(item.end_date), "dd MMM yy")}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${item.is_active ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${item.enable_on_bill ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
                      {item.enable_on_bill ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => handleEdit(item)} className="text-gold hover:text-gold-light text-xs uppercase tracking-wider font-bold">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111111] border border-gold/20 p-8 w-[500px] max-w-full">
            <h2 className="text-xl font-display text-white mb-6">
              {formData.id ? "Edit Festival" : "Add Festival"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Name</label>
                <input 
                  className="w-full bg-[#161616] border border-white/10 p-2 text-white text-sm focus:border-gold/50 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Start Date</label>
                  <input 
                    type="date"
                    className="w-full bg-[#161616] border border-white/10 p-2 text-white text-sm focus:border-gold/50 outline-none" 
                    value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">End Date</label>
                  <input 
                    type="date"
                    className="w-full bg-[#161616] border border-white/10 p-2 text-white text-sm focus:border-gold/50 outline-none" 
                    value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={formData.is_active} 
                  onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                />
                <label htmlFor="active" className="text-sm text-white">Festival is Active</label>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                <input 
                  type="checkbox" 
                  id="bill"
                  checked={formData.enable_on_bill} 
                  onChange={e => setFormData({...formData, enable_on_bill: e.target.checked})} 
                />
                <label htmlFor="bill" className="text-sm text-gold">Enable Greeting on Invoice</label>
              </div>

              {formData.enable_on_bill && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Bill Greeting Text</label>
                  <textarea 
                    className="w-full bg-[#161616] border border-white/10 p-2 text-white text-sm focus:border-gold/50 outline-none h-24" 
                    value={formData.bill_greeting_text} onChange={e => setFormData({...formData, bill_greeting_text: e.target.value})} 
                    placeholder="✨ Wishing you and your family a very Happy Diwali! — Tirupati Jewellers"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/50 hover:text-white text-xs uppercase tracking-widest font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="bg-gold hover:bg-gold-light text-[#070707] px-6 py-2 text-xs uppercase tracking-widest font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
