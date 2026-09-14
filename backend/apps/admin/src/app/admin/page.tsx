"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  JewelleryProduct,
  getStoredJewelleryProducts,
  addJewelleryProduct,
  deleteJewelleryProduct,
} from "@/lib/admin-products";
import { isAdminAuthenticated, getAdminUser } from "@/lib/admin-auth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [products, setProducts] = useState<JewelleryProduct[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");

  // Form State for Adding New Jewellery
  const [formData, setFormData] = useState({
    title: "",
    category: "rings" as JewelleryProduct["category"],
    purity: "22K BIS 916 Hallmarked",
    goldWeight: "15.0g",
    diamondWeight: "1.00ct VVS1-EF",
    price: 95000,
    badge: "NEW" as JewelleryProduct["badge"],
    imageUrl: "/image/luxury/prod_ring.jpg",
    description: "",
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
    } else {
      setAuthenticated(true);
      setProducts(getStoredJewelleryProducts());
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("tj_admin_authenticated");
    localStorage.removeItem("tj_admin_user");
    router.push("/admin/login");
  };

  const adminUser = getAdminUser();

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.price <= 0) {
      alert("Please provide a valid jewellery title and price.");
      return;
    }

    const created = addJewelleryProduct({
      title: formData.title.trim(),
      category: formData.category,
      purity: formData.purity,
      goldWeight: formData.goldWeight,
      diamondWeight: formData.diamondWeight,
      price: Number(formData.price),
      badge: formData.badge,
      imageUrl: formData.imageUrl,
      description: formData.description || "Exquisite handcrafted fine jewellery piece by Tirupati Jewellers.",
      inStock: true,
    });

    setProducts(getStoredJewelleryProducts());
    setShowAddModal(false);
    setSuccessNotice(`"${created.title}" was published live to the storefront!`);
    setTimeout(() => setSuccessNotice(""), 5000);

    // Reset Form
    setFormData({
      title: "",
      category: "rings",
      purity: "22K BIS 916 Hallmarked",
      goldWeight: "15.0g",
      diamondWeight: "1.00ct VVS1-EF",
      price: 95000,
      badge: "NEW",
      imageUrl: "/image/luxury/prod_ring.jpg",
      description: "",
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to remove "${title}" from the live catalogue?`)) {
      deleteJewelleryProduct(id);
      setProducts(getStoredJewelleryProducts());
      setSuccessNotice(`Removed "${title}".`);
      setTimeout(() => setSuccessNotice(""), 4000);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center text-white font-sans text-xs">
        Checking admin permissions...
      </div>
    );
  }

  const presetImages = [
    { label: "Solitaire Diamond Ring", url: "/image/luxury/prod_ring.jpg" },
    { label: "Royal Emerald & Polki Choker", url: "/image/luxury/prod_choker.jpg" },
    { label: "Imperial Ruby Temple Jhumkas", url: "/image/luxury/prod_earrings.jpg" },
    { label: "Diamond Tennis Bracelet Cuff", url: "/image/luxury/prod_bracelet.jpg" },
    { label: "Grand Royal Bridal Set", url: "/image/luxury/bridal.jpg" },
    { label: "Master Atelier Creation", url: "/image/luxury/craftsmanship.jpg" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      
      {/* Top Admin Bar */}
      <header className="bg-[#111111] border-b border-gold/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold">👑</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">
              TIRUPATI JEWELLERS
            </h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">
              ADMINISTRATION & INVENTORY CONTROL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {adminUser && (
            <span className="text-[10px] font-sans text-white/40 uppercase tracking-wider hidden sm:block">
              {adminUser}
            </span>
          )}
          <a
            href="http://localhost:3000/"
            target="_blank"
            className="text-xs font-sans text-white/70 hover:text-gold uppercase tracking-wider flex items-center gap-1"
          >
            <span>↗</span> Storefront
          </a>
          <Link
            href="/admin/billing"
            className="border border-gold bg-gold/20 text-gold hover:bg-gold hover:text-black font-sans text-xs uppercase tracking-widest px-3 py-1.5 font-bold transition-colors flex items-center gap-1.5"
          >
            🧾 Offline Billing
          </Link>
          <Link
            href="/admin/barcodes"
            className="border border-gold bg-gold/20 text-gold hover:bg-gold hover:text-black font-sans text-xs uppercase tracking-widest px-3 py-1.5 font-bold transition-colors flex items-center gap-1.5"
          >
            📊 Barcodes
          </Link>
          <a
            href="http://localhost:9000/app"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/20 text-white/60 hover:text-gold font-sans text-xs uppercase tracking-wider px-3 py-1.5 transition-colors"
          >
            Medusa ↗
          </a>
          <button
            onClick={handleLogout}
            className="bg-red-900/30 hover:bg-red-800 text-red-200 border border-red-700/50 font-sans text-xs uppercase tracking-wider px-3 py-1.5 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Success Banner */}
        {successNotice && (
          <div className="mb-8 p-4 bg-green-950/80 border border-green-500/60 text-green-200 text-xs font-sans flex justify-between items-center shadow-xl">
            <span>✓ {successNotice}</span>
            <button onClick={() => setSuccessNotice("")} className="text-white/60 hover:text-white">✕</button>
          </div>
        )}

        {/* Dashboard Actions & Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          <div className="bg-[#121212] border border-white/10 p-6">
            <p className="font-sans text-[11px] uppercase tracking-widest text-gold-light mb-1 font-semibold">Live Catalogue Items</p>
            <p className="font-display text-3xl font-bold text-white">{products.length}</p>
          </div>

          <div className="bg-[#121212] border border-white/10 p-6">
            <p className="font-sans text-[11px] uppercase tracking-widest text-gold-light mb-1 font-semibold">Gold Purity Standard</p>
            <p className="font-display text-xl font-bold text-white">100% BIS 916</p>
          </div>

          <div className="bg-[#121212] border border-white/10 p-6 flex flex-col justify-between">
            <p className="font-sans text-[11px] uppercase tracking-widest text-gold-light mb-1 font-semibold">Barcode System</p>
            <Link href="/admin/barcodes" className="font-display text-xl font-bold text-white hover:text-gold transition-colors">
              Manage →
            </Link>
            <Link href="/admin/barcodes/scanner" className="font-sans text-[10px] text-white/40 hover:text-gold mt-1 uppercase tracking-wider">
              📷 Open Scanner
            </Link>
          </div>

          <div className="bg-[#121212] border border-gold/40 p-6 flex flex-col justify-between">
            <p className="font-sans text-[11px] uppercase tracking-widest text-gold font-bold mb-2">Live Store Action</p>
            <div className="space-y-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full bg-gold hover:bg-gold-light text-[#070707] py-2.5 px-4 font-sans text-xs uppercase tracking-widest font-bold transition-colors text-center shadow-lg"
              >
                + Add New Jewellery
              </button>
              <Link
                href="/admin/billing/create"
                className="w-full block bg-[#1a1610] hover:bg-gold/20 border border-gold/40 text-gold py-2.5 px-4 font-sans text-xs uppercase tracking-widest font-bold transition-colors text-center"
              >
                🧾 New GST Invoice
              </Link>
            </div>
          </div>

        </div>

        {/* Live Products Table Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="font-display text-2xl text-white font-normal">
              Active Jewellery & Diamond Inventory
            </h2>
            <p className="font-sans text-xs text-white/50 mt-1">
              Changes made here reflect immediately on Tirupati Jewellers storefront.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gold hover:bg-gold-light text-[#070707] py-2.5 px-6 font-sans text-xs uppercase tracking-widest font-bold transition-colors shadow-lg"
          >
            + Add Jewellery Item
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-[#111111] border border-white/10 overflow-x-auto shadow-2xl">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-[#181818] text-gold-light uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="py-4 px-6">Piece Preview</th>
                <th className="py-4 px-6">Title & Category</th>
                <th className="py-4 px-6">Gold / Diamond Specs</th>
                <th className="py-4 px-6">Price (INR)</th>
                <th className="py-4 px-6">Badge</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((item) => (
                <tr key={item.id} className="hover:bg-[#161616] transition-colors">
                  
                  {/* Photo */}
                  <td className="py-4 px-6">
                    <div className="w-14 h-14 bg-[#070707] border border-gold/30 overflow-hidden">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  </td>

                  {/* Title & Category */}
                  <td className="py-4 px-6">
                    <p className="font-serif text-base text-white font-normal">{item.title}</p>
                    <p className="text-gold text-[10px] uppercase tracking-wider mt-0.5">{item.category}</p>
                  </td>

                  {/* Specs */}
                  <td className="py-4 px-6">
                    <p className="text-white/90 font-medium">{item.purity}</p>
                    <p className="text-white/50 text-[10px] mt-0.5">
                      {item.goldWeight ? `Gold: ${item.goldWeight}` : ""} {item.diamondWeight ? `• Dia: ${item.diamondWeight}` : ""}
                    </p>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-6">
                    <span className="font-serif text-base text-gold font-bold">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.price)}
                    </span>
                  </td>

                  {/* Badge */}
                  <td className="py-4 px-6">
                    <span className="bg-[#070707] text-gold text-[9px] font-bold px-2 py-0.5 border border-gold/30 tracking-wider">
                      {item.badge}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right space-x-3">
                    <Link
                      href={`/product/${item.handle}`}
                      target="_blank"
                      className="text-gold-light hover:text-white underline"
                    >
                      View Live ↗
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="text-red-400 hover:text-red-300 hover:underline"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>

      {/* ADD JEWELLERY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-gold/40 max-w-2xl w-full p-8 shadow-2xl my-8">
            
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 className="font-display text-2xl text-white">Add Fine Jewellery & Diamonds</h3>
                <p className="font-sans text-xs text-gold-light mt-1">Publish live to Tirupati Jewellers storefront</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/60 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 font-sans text-xs">
              
              {/* Title */}
              <div>
                <label className="block text-gold-light font-bold mb-1 uppercase tracking-wider">
                  Jewellery Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tirupati Royal Kundan Choker Set"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#181818] border border-white/20 p-3 text-white focus:outline-none focus:border-gold"
                />
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gold-light font-bold mb-1 uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-[#181818] border border-white/20 p-3 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="rings">Solitaire & Polki Rings</option>
                    <option value="necklaces">Chokers & Haars</option>
                    <option value="earrings">Temple & Diamond Earrings</option>
                    <option value="bracelets">Bracelets & Kadas</option>
                    <option value="bridal">Royal Bridal Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gold-light font-bold mb-1 uppercase tracking-wider">
                    Badge
                  </label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value as any })}
                    className="w-full bg-[#181818] border border-white/20 p-3 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="NEW">NEW CREATION</option>
                    <option value="BESTSELLER">BESTSELLER</option>
                    <option value="ROYAL BRIDAL">ROYAL BRIDAL</option>
                    <option value="EXCLUSIVE">EXCLUSIVE</option>
                    <option value="HERITAGE TEMPLE">HERITAGE TEMPLE</option>
                  </select>
                </div>
              </div>

              {/* Purity & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gold-light font-bold mb-1 uppercase tracking-wider">
                    Metal Purity *
                  </label>
                  <select
                    value={formData.purity}
                    onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                    className="w-full bg-[#181818] border border-white/20 p-3 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="24K Gold • 99.9% Pure">24K Gold • 99.9% Pure</option>
                    <option value="22K BIS 916 Hallmarked">22K BIS 916 Hallmarked</option>
                    <option value="18K Solid Gold">18K Solid Gold</option>
                    <option value="Platinum 950">Platinum 950</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gold-light font-bold mb-1 uppercase tracking-wider">
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    placeholder="125000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-[#181818] border border-white/20 p-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Gold & Diamond Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gold-light font-bold mb-1 uppercase tracking-wider">
                    Net Gold Weight (g)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24.5g"
                    value={formData.goldWeight}
                    onChange={(e) => setFormData({ ...formData, goldWeight: e.target.value })}
                    className="w-full bg-[#181818] border border-white/20 p-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-gold-light font-bold mb-1 uppercase tracking-wider">
                    Diamond Specs
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1.85ct VVS1-EF"
                    value={formData.diamondWeight}
                    onChange={(e) => setFormData({ ...formData, diamondWeight: e.target.value })}
                    className="w-full bg-[#181818] border border-white/20 p-3 text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Choose Preset Image */}
              <div>
                <label className="block text-gold-light font-bold mb-1 uppercase tracking-wider">
                  Select Jewellery Image *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                  {presetImages.map((preset) => (
                    <button
                      type="button"
                      key={preset.url}
                      onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                      className={`aspect-square border-2 overflow-hidden ${
                        formData.imageUrl === preset.url ? "border-gold" : "border-white/20 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom image URL: https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-[#181818] border border-white/20 p-2.5 text-white focus:outline-none focus:border-gold text-[11px]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gold-light font-bold mb-1 uppercase tracking-wider">
                  Description / Story
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the royal craftsmanship, gemstone setting, and hallmarking..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#181818] border border-white/20 p-3 text-white focus:outline-none focus:border-gold"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 border border-white/20 text-white/70 hover:text-white uppercase tracking-wider font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gold hover:bg-gold-light text-[#070707] font-bold uppercase tracking-widest transition-colors shadow-lg"
                >
                  Publish to Storefront
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
