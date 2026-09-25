"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  JewelleryProduct,
  AdminCategory,
  fetchAdminCategories,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "@/lib/admin-products";
import { JewelleryMetadata, JewelleryType, MetalType, Gender, ChargeType } from "@/lib/jewellery";
import { isAdminAuthenticated, getAdminUser, logoutAdmin } from "@/lib/admin-auth";
import { RequirePermission } from "@/components/RequirePermission";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [products, setProducts] = useState<JewelleryProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    price: 95000,
    badge: "NEW CREATION",
    imageUrl: "/image/luxury/prod_ring.jpg",
    description: "",
    
    // Jewellery Details
    jewellery_type: "RING" as JewelleryType,
    metal_type: "GOLD" as MetalType,
    purity: "22K BIS 916 Hallmarked",
    gross_weight_g: "",
    net_weight_g: "",
    gender: "WOMEN" as Gender,
    
    // Compliance
    hsn_sac: "",
    
    // Charges
    making_charge_type: "FIXED" as ChargeType,
    making_charge_value: "",
    stone_charge_type: "FIXED" as ChargeType,
    stone_charge_value: "",
    
    // Diamond (Toggle)
    has_diamond: false,
    diamond_carat: "",
    diamond_shape: "",
    diamond_color: "",
    diamond_clarity: "",
    diamond_cut: "",
    
    // Certificate (Toggle)
    has_certificate: false,
    cert_type: "",
    cert_provider: "",
    cert_number: "",
    cert_url: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        fetchAdminCategories(),
        fetchAdminProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
      if (cats.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [formData.categoryId]);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
    } else {
      setAuthenticated(true);
      loadData();
    }
  }, [router, loadData]);

  const handleLogout = () => {
    logoutAdmin();
    router.push("/admin/login");
  };

  const adminUser = getAdminUser();

  const resetForm = () => {
    setFormData({
      title: "",
      categoryId: categories[0]?.id || "",
      price: 95000,
      badge: "NEW CREATION",
      imageUrl: "/image/luxury/prod_ring.jpg",
      description: "",
      jewellery_type: "RING",
      metal_type: "GOLD",
      purity: "22K BIS 916 Hallmarked",
      gross_weight_g: "",
      net_weight_g: "",
      gender: "WOMEN",
      hsn_sac: "",
      making_charge_type: "FIXED",
      making_charge_value: "",
      stone_charge_type: "FIXED",
      stone_charge_value: "",
      has_diamond: false,
      diamond_carat: "",
      diamond_shape: "",
      diamond_color: "",
      diamond_clarity: "",
      diamond_cut: "",
      has_certificate: false,
      cert_type: "",
      cert_provider: "",
      cert_number: "",
      cert_url: "",
    });
    setEditModeId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (p: JewelleryProduct) => {
    const meta = p.jewellery;
    setFormData({
      title: p.title,
      categoryId: p.categoryId || "",
      price: p.price,
      badge: p.badge || "NEW CREATION",
      imageUrl: p.imageUrl || "",
      description: p.description || "",
      
      jewellery_type: meta?.jewellery_type || "RING",
      metal_type: meta?.metal_type || "GOLD",
      purity: meta?.purity || "",
      gross_weight_g: meta?.gross_weight_g ? String(meta.gross_weight_g) : "",
      net_weight_g: meta?.net_weight_g ? String(meta.net_weight_g) : "",
      gender: meta?.gender || "WOMEN",
      
      hsn_sac: meta?.hsn_sac || "",
      
      making_charge_type: meta?.making_charge?.type || "FIXED",
      making_charge_value: meta?.making_charge?.value ? String(meta.making_charge.value) : "",
      stone_charge_type: meta?.stone_charge?.type || "FIXED",
      stone_charge_value: meta?.stone_charge?.value ? String(meta.stone_charge.value) : "",
      
      has_diamond: !!meta?.diamond,
      diamond_carat: meta?.diamond?.carat ? String(meta.diamond.carat) : "",
      diamond_shape: meta?.diamond?.shape || "",
      diamond_color: meta?.diamond?.color || "",
      diamond_clarity: meta?.diamond?.clarity || "",
      diamond_cut: meta?.diamond?.cut || "",
      
      has_certificate: !!meta?.certificate,
      cert_type: meta?.certificate?.type || "",
      cert_provider: meta?.certificate?.provider || "",
      cert_number: meta?.certificate?.number || "",
      cert_url: meta?.certificate?.url || "",
    });
    setEditModeId(p.id);
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.price <= 0) {
      alert("Please provide a valid title and price.");
      return;
    }

    // Phase 13: Strict Validation before API submission
    const gw = Number(formData.gross_weight_g);
    const nw = Number(formData.net_weight_g);
    
    if (formData.gross_weight_g && (isNaN(gw) || gw < 0)) {
      return alert("Gross weight must be a valid positive number.");
    }
    if (formData.net_weight_g && (isNaN(nw) || nw < 0)) {
      return alert("Net weight must be a valid positive number.");
    }
    if (formData.gross_weight_g && formData.net_weight_g && nw > gw) {
      return alert("Net weight cannot exceed gross weight.");
    }

    // Construct Master Metadata
    const jMeta: any = {
      schema_version: 1,
      jewellery_type: formData.jewellery_type,
      metal_type: formData.metal_type,
      purity: formData.purity,
      gender: formData.gender,
    };

    if (formData.gross_weight_g) jMeta.gross_weight_g = gw;
    if (formData.net_weight_g) jMeta.net_weight_g = nw;
    if (formData.hsn_sac.trim()) jMeta.hsn_sac = formData.hsn_sac.trim();

    if (formData.making_charge_value) {
      jMeta.making_charge = { type: formData.making_charge_type, value: Number(formData.making_charge_value) };
    }
    if (formData.stone_charge_value) {
      jMeta.stone_charge = { type: formData.stone_charge_type, value: Number(formData.stone_charge_value) };
    }

    if (formData.has_diamond) {
      jMeta.diamond = {};
      if (formData.diamond_carat) jMeta.diamond.carat = Number(formData.diamond_carat);
      if (formData.diamond_shape) jMeta.diamond.shape = formData.diamond_shape;
      if (formData.diamond_color) jMeta.diamond.color = formData.diamond_color;
      if (formData.diamond_clarity) jMeta.diamond.clarity = formData.diamond_clarity;
      if (formData.diamond_cut) jMeta.diamond.cut = formData.diamond_cut;
    }

    if (formData.has_certificate) {
      jMeta.certificate = {};
      if (formData.cert_type) jMeta.certificate.type = formData.cert_type;
      if (formData.cert_provider) jMeta.certificate.provider = formData.cert_provider;
      if (formData.cert_number) jMeta.certificate.number = formData.cert_number;
      if (formData.cert_url) jMeta.certificate.url = formData.cert_url;
    }

    setSubmitting(true);
    
    const productPayload = {
      title: formData.title,
      categoryId: formData.categoryId,
      price: formData.price,
      badge: formData.badge,
      imageUrl: formData.imageUrl,
      description: formData.description,
      jewellery: jMeta as JewelleryMetadata,
    };

    let result;
    if (editModeId) {
      result = await updateAdminProduct(editModeId, productPayload);
    } else {
      result = await createAdminProduct(productPayload);
    }

    if (result.success) {
      await loadData();
      setShowModal(false);
      setSuccessNotice(`"${result.product?.title || formData.title}" was ${editModeId ? "updated" : "published live"}!`);
      setTimeout(() => setSuccessNotice(""), 5000);
      resetForm();
    } else {
      alert(result.error || "Failed to save jewellery to Medusa backend.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to remove "${title}" from the live catalogue?`)) {
      const ok = await deleteAdminProduct(id);
      if (ok) {
        await loadData();
        setSuccessNotice(`Removed "${title}".`);
        setTimeout(() => setSuccessNotice(""), 4000);
      } else {
        alert(`Failed to delete "${title}".`);
      }
    }
  };

  if (!authenticated) {
    return <div className="min-h-screen bg-[#070707] flex items-center justify-center text-white text-xs">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans text-xs">
      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {successNotice && (
          <div className="mb-8 p-4 bg-green-950/80 border border-green-500/60 text-green-200 flex justify-between">
            <span>✓ {successNotice}</span>
            <button onClick={() => setSuccessNotice("")} className="text-white/60 hover:text-white">✕</button>
          </div>
        )}

        {/* METRICS & ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#121212] border border-white/10 p-6">
            <p className="uppercase tracking-widest text-gold-light mb-1 font-semibold">Live Items</p>
            <p className="font-display text-3xl font-bold">{products.length}</p>
          </div>
          <div className="bg-[#121212] border border-gold/40 p-6 flex flex-col justify-center sm:col-span-2 lg:col-span-1">
            <RequirePermission code="products.create">
              <button onClick={openAddModal} className="w-full bg-gold hover:bg-gold-light text-[#070707] py-3 px-4 uppercase tracking-widest font-bold shadow-lg">
                + Add Master Jewellery
              </button>
            </RequirePermission>
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="bg-[#111111] border border-white/10 overflow-x-auto shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-4 px-6">Preview</th>
                <th className="py-4 px-6">Product Identity</th>
                <th className="py-4 px-6">Jewellery Master Data</th>
                <th className="py-4 px-6">Price (INR)</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((item) => (
                <tr key={item.id} className="hover:bg-[#161616] transition-colors">
                  <td className="py-4 px-6">
                    <div className="w-14 h-14 bg-[#070707] border border-gold/30">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-white/20">No Img</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-serif text-base text-white">{item.title}</p>
                    <p className="text-gold text-[10px] uppercase tracking-wider mt-0.5">{item.category}</p>
                  </td>
                  <td className="py-4 px-6">
                    {/* Phase 19: Product Detail in Admin table using Structured Fields */}
                    <div className="flex flex-col gap-1">
                      {item.jewellery?.purity && <p className="text-white/90 font-bold">{item.jewellery.purity} {item.jewellery.metal_type}</p>}
                      {(item.jewellery?.gross_weight_g || item.jewellery?.net_weight_g) && (
                        <p className="text-white/50 text-[10px]">
                          Gross: {item.jewellery.gross_weight_g ? `${item.jewellery.gross_weight_g}g` : "--"} • 
                          Net: {item.jewellery.net_weight_g ? `${item.jewellery.net_weight_g}g` : "--"}
                        </p>
                      )}
                      {item.jewellery?.diamond && (
                        <p className="text-cyan-200/70 text-[10px]">Diamond: {item.jewellery.diamond.carat}ct {item.jewellery.diamond.color} {item.jewellery.diamond.clarity}</p>
                      )}
                      {item.jewellery?.hsn_sac && (
                        <p className="text-emerald-200/70 text-[10px]">HSN: {item.jewellery.hsn_sac}</p>
                      )}
                      {!item.jewellery && <p className="text-white/30 italic">No master data</p>}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-serif text-base text-gold font-bold">
                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.price)}
                  </td>
                  <td className="py-4 px-6 text-right space-x-3">
                    <RequirePermission code="products.update">
                      <button onClick={() => openEditModal(item)} className="text-blue-400 hover:text-blue-300">Edit</button>
                    </RequirePermission>
                    <RequirePermission code="products.delete">
                      <button onClick={() => handleDelete(item.id, item.title)} className="text-red-400 hover:text-red-300">Delete</button>
                    </RequirePermission>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* JEWELLERY MASTER DATA FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-gold/40 max-w-4xl w-full p-8 shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="sticky top-0 bg-[#111111] z-10 flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="font-display text-2xl text-white">{editModeId ? "Edit" : "Add"} Master Jewellery</h3>
                <p className="text-gold-light mt-1">Configure canonical metadata for PostgreSQL and Storefront</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-8">
              
              {/* SECTION: GENERAL */}
              <section className="bg-[#181818] p-5 border border-white/5">
                <h4 className="text-gold uppercase tracking-widest font-bold border-b border-white/10 pb-2 mb-4">General Commerce Data</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-white/70 mb-1">Product Title *</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" />
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1">Category *</label>
                    <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1">Selling Price (INR) *</label>
                    <input type="number" required min="1" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-white/70 mb-1">Image URL</label>
                    <input type="text" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-white/70 mb-1">Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" rows={3}></textarea>
                  </div>
                </div>
              </section>

              {/* SECTION: JEWELLERY DETAILS */}
              <section className="bg-[#181818] p-5 border border-white/5">
                <h4 className="text-gold uppercase tracking-widest font-bold border-b border-white/10 pb-2 mb-4">Jewellery Master Data</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/70 mb-1">Type</label>
                    <select value={formData.jewellery_type} onChange={e => setFormData({...formData, jewellery_type: e.target.value as any})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none">
                      {["RING", "NECKLACE", "EARRINGS", "BRACELET", "BANGLE", "PENDANT", "CHAIN", "NOSE_PIN", "ANKLET", "OTHER"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1">Metal</label>
                    <select value={formData.metal_type} onChange={e => setFormData({...formData, metal_type: e.target.value as any})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none">
                      {["GOLD", "SILVER", "PLATINUM", "OTHER"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1">Purity Label</label>
                    <input type="text" placeholder="e.g. 22K BIS 916" value={formData.purity} onChange={e => setFormData({...formData, purity: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" />
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1">Gross Weight (grams)</label>
                    <input type="number" step="0.001" placeholder="15.500" value={formData.gross_weight_g} onChange={e => setFormData({...formData, gross_weight_g: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" />
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1">Net Weight (grams)</label>
                    <input type="number" step="0.001" placeholder="14.200" value={formData.net_weight_g} onChange={e => setFormData({...formData, net_weight_g: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" />
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none">
                      {["WOMEN", "MEN", "UNISEX", "OTHER"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* SECTION: COMPLIANCE & CHARGES */}
              <section className="bg-[#181818] p-5 border border-white/5">
                <h4 className="text-gold uppercase tracking-widest font-bold border-b border-white/10 pb-2 mb-4">Compliance & Master Charges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-emerald-300/80 mb-1 font-bold">HSN/SAC Code</label>
                    <input type="text" placeholder="e.g. 711319" value={formData.hsn_sac} onChange={e => setFormData({...formData, hsn_sac: e.target.value})} className="w-full bg-[#0a0a0a] border border-emerald-500/30 p-2 focus:border-emerald-500 outline-none text-emerald-100" />
                  </div>
                  <div className="opacity-0 hidden md:block"></div>
                  
                  <div className="flex gap-2">
                    <div className="flex-grow">
                      <label className="block text-white/70 mb-1">Making Charge</label>
                      <input type="number" step="0.01" value={formData.making_charge_value} onChange={e => setFormData({...formData, making_charge_value: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-white/70 mb-1">Type</label>
                      <select value={formData.making_charge_type} onChange={e => setFormData({...formData, making_charge_type: e.target.value as any})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none">
                        <option value="FIXED">Fixed</option><option value="PER_GRAM">Per g</option><option value="PERCENTAGE">%</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-grow">
                      <label className="block text-white/70 mb-1">Stone Charge</label>
                      <input type="number" step="0.01" value={formData.stone_charge_value} onChange={e => setFormData({...formData, stone_charge_value: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-white/70 mb-1">Type</label>
                      <select value={formData.stone_charge_type} onChange={e => setFormData({...formData, stone_charge_type: e.target.value as any})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none">
                        <option value="FIXED">Fixed</option><option value="PER_GRAM">Per g</option><option value="PERCENTAGE">%</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION: DIAMOND */}
              <section className="bg-[#181818] p-5 border border-white/5">
                <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                  <h4 className="text-gold uppercase tracking-widest font-bold">Diamond Details</h4>
                  <label className="flex items-center gap-2 cursor-pointer text-white/70">
                    <input type="checkbox" checked={formData.has_diamond} onChange={e => setFormData({...formData, has_diamond: e.target.checked})} className="accent-gold w-4 h-4" />
                    Contains Diamonds
                  </label>
                </div>
                {formData.has_diamond && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div><label className="block text-white/70 mb-1">Carat</label><input type="number" step="0.01" value={formData.diamond_carat} onChange={e => setFormData({...formData, diamond_carat: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" /></div>
                    <div><label className="block text-white/70 mb-1">Color</label><input type="text" placeholder="E-F" value={formData.diamond_color} onChange={e => setFormData({...formData, diamond_color: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" /></div>
                    <div><label className="block text-white/70 mb-1">Clarity</label><input type="text" placeholder="VVS1" value={formData.diamond_clarity} onChange={e => setFormData({...formData, diamond_clarity: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" /></div>
                    <div><label className="block text-white/70 mb-1">Cut</label><input type="text" placeholder="Excellent" value={formData.diamond_cut} onChange={e => setFormData({...formData, diamond_cut: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" /></div>
                    <div><label className="block text-white/70 mb-1">Shape</label><input type="text" placeholder="Round Brilliant" value={formData.diamond_shape} onChange={e => setFormData({...formData, diamond_shape: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" /></div>
                  </div>
                )}
              </section>

              {/* SECTION: CERTIFICATE */}
              <section className="bg-[#181818] p-5 border border-white/5">
                <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                  <h4 className="text-gold uppercase tracking-widest font-bold">Certification</h4>
                  <label className="flex items-center gap-2 cursor-pointer text-white/70">
                    <input type="checkbox" checked={formData.has_certificate} onChange={e => setFormData({...formData, has_certificate: e.target.checked})} className="accent-gold w-4 h-4" />
                    Has Certificate
                  </label>
                </div>
                {formData.has_certificate && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-white/70 mb-1">Provider (IGI, GIA, BIS)</label><input type="text" value={formData.cert_provider} onChange={e => setFormData({...formData, cert_provider: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" /></div>
                    <div><label className="block text-white/70 mb-1">Certificate Number</label><input type="text" value={formData.cert_number} onChange={e => setFormData({...formData, cert_number: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" /></div>
                    <div className="md:col-span-2"><label className="block text-white/70 mb-1">Certificate URL (Verification Link / PDF)</label><input type="text" value={formData.cert_url} onChange={e => setFormData({...formData, cert_url: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/20 p-2 focus:border-gold outline-none" /></div>
                  </div>
                )}
              </section>

              {/* ACTIONS */}
              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-[#111111] py-4 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 border border-white/20 text-white/70 hover:text-white uppercase tracking-wider font-bold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 bg-gold hover:bg-gold-light text-[#070707] font-bold uppercase tracking-widest transition-colors shadow-lg disabled:opacity-50">
                  {submitting ? "Saving..." : "Save Master Product"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Global styling overrides for custom scrollbar inside modal */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}} />
    </div>
  );
}
