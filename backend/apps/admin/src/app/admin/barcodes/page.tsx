"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import JsBarcode from "jsbarcode";

const MEDUSA_BACKEND = "http://localhost:9000";

interface MedusaVariant {
  id: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  prices?: any[];
}

interface MedusaProduct {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  status: string;
  variants: MedusaVariant[];
}

export default function BarcodesPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [products, setProducts] = useState<MedusaProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchBarcode, setSearchBarcode] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [selectedBarcode, setSelectedBarcode] = useState<{
    barcode: string;
    productTitle: string;
    variantTitle: string;
    sku: string;
  } | null>(null);

  const barcodeCanvasRef = useRef<SVGSVGElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
    } else {
      setAuthenticated(true);
      fetchProducts();
    }
  }, [router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Login to Medusa admin
      const authRes = await fetch(`${MEDUSA_BACKEND}/auth/user/emailpass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "hello@tirupatijewellers.com",
          password: "mysecurepassword123",
        }),
      });
      const authData = await authRes.json();
      const token = authData.token;

      if (!token) {
        console.error("Failed to get admin token");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${MEDUSA_BACKEND}/admin/products?limit=100&fields=id,title,handle,thumbnail,status,*variants`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAdminToken = async (): Promise<string> => {
    const authRes = await fetch(`${MEDUSA_BACKEND}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "hello@tirupatijewellers.com",
        password: "mysecurepassword123",
      }),
    });
    const authData = await authRes.json();
    return authData.token;
  };

  const generateBarcode = async (productId: string, variantId: string) => {
    setGeneratingFor(variantId);
    try {
      const token = await getAdminToken();
      const res = await fetch(`${MEDUSA_BACKEND}/admin/barcodes/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, variant_id: variantId }),
      });
      const data = await res.json();

      if (data.success) {
        showNotification(`Barcode ${data.barcode} generated successfully!`, "success");
        await fetchProducts();
      } else {
        showNotification(data.error || "Failed to generate barcode", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Error generating barcode", "error");
    } finally {
      setGeneratingFor(null);
    }
  };

  const regenerateBarcode = async (productId: string, variantId: string) => {
    if (!confirm("Are you sure you want to regenerate this barcode? The existing barcode will be permanently replaced.")) {
      return;
    }

    setGeneratingFor(variantId);
    try {
      const token = await getAdminToken();

      // First clear the existing barcode
      await fetch(`${MEDUSA_BACKEND}/admin/products/${productId}/variants/${variantId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ barcode: null }),
      });

      // Then generate a new one
      const res = await fetch(`${MEDUSA_BACKEND}/admin/barcodes/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, variant_id: variantId }),
      });
      const data = await res.json();

      if (data.success) {
        showNotification(`New barcode ${data.barcode} assigned!`, "success");
        await fetchProducts();
      } else {
        showNotification(data.error || "Failed to regenerate barcode", "error");
      }
    } catch (err: any) {
      showNotification(err.message || "Error regenerating barcode", "error");
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleSearch = async () => {
    if (!searchBarcode.trim()) return;
    setSearchLoading(true);
    try {
      const token = await getAdminToken();
      const res = await fetch(
        `${MEDUSA_BACKEND}/admin/barcodes?barcode=${encodeURIComponent(searchBarcode.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      showNotification("Search failed", "error");
    } finally {
      setSearchLoading(false);
    }
  };

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 5000);
  };

  const viewBarcode = (barcode: string, productTitle: string, variantTitle: string, sku: string) => {
    setSelectedBarcode({ barcode, productTitle, variantTitle, sku });
  };

  const renderBarcodeToSvg = useCallback(() => {
    if (selectedBarcode && barcodeCanvasRef.current) {
      try {
        JsBarcode(barcodeCanvasRef.current, selectedBarcode.barcode, {
          format: "EAN13",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 16,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch {
        // Fallback for non-EAN13
        JsBarcode(barcodeCanvasRef.current, selectedBarcode.barcode, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000",
        });
      }
    }
  }, [selectedBarcode]);

  useEffect(() => {
    if (selectedBarcode) {
      setTimeout(renderBarcodeToSvg, 100);
    }
  }, [selectedBarcode, renderBarcodeToSvg]);

  const downloadBarcode = () => {
    if (!barcodeCanvasRef.current || !selectedBarcode) return;
    const svgData = new XMLSerializer().serializeToString(barcodeCanvasRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.scale(2, 2);
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `barcode-${selectedBarcode.barcode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const printBarcode = () => {
    if (!printRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode — ${selectedBarcode?.barcode}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; text-align: center; padding: 20px; }
            .label { border: 2px solid #000; padding: 16px 24px; display: inline-block; }
            .brand { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #888; margin-bottom: 8px; }
            .product-title { font-size: 13px; font-weight: 600; margin: 6px 0 2px; }
            .variant { font-size: 11px; color: #666; }
            .sku { font-size: 10px; color: #999; margin-top: 2px; }
            svg { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="brand">Tirupati Jewellers</div>
            <div class="product-title">${selectedBarcode?.productTitle}</div>
            <div class="variant">${selectedBarcode?.variantTitle}</div>
            <div class="sku">SKU: ${selectedBarcode?.sku || "—"}</div>
            ${printRef.current.innerHTML}
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const copyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    showNotification(`Barcode ${barcode} copied to clipboard`, "success");
  };

  const totalVariants = products.reduce((sum, p) => sum + (p.variants?.length || 0), 0);
  const withBarcode = products.reduce(
    (sum, p) => sum + (p.variants?.filter((v) => v.barcode)?.length || 0),
    0
  );

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center text-white font-sans text-xs">
        Checking admin permissions...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#111111] border-b border-gold/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-gold">📊</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">
              BARCODE MANAGEMENT
            </h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">
              JEWELLERY IDENTIFICATION SYSTEM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/barcodes/scanner"
            className="bg-gold/20 border border-gold text-gold hover:bg-gold hover:text-black font-sans text-xs uppercase tracking-widest px-4 py-2 font-bold transition-colors flex items-center gap-1.5"
          >
            📷 Scan Barcode
          </Link>
          <Link
            href="/admin"
            className="border border-white/20 text-white/60 hover:text-gold font-sans text-xs uppercase tracking-wider px-3 py-1.5 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Notification */}
        {notification.message && (
          <div
            className={`mb-6 p-4 text-xs font-sans flex justify-between items-center shadow-xl border ${
              notification.type === "success"
                ? "bg-green-950/80 border-green-500/60 text-green-200"
                : "bg-red-950/80 border-red-500/60 text-red-200"
            }`}
          >
            <span>{notification.type === "success" ? "✓" : "✕"} {notification.message}</span>
            <button onClick={() => setNotification({ message: "", type: "" })} className="text-white/60 hover:text-white">✕</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#121212] border border-white/10 p-6">
            <p className="font-sans text-[11px] uppercase tracking-widest text-gold-light mb-1 font-semibold">
              Total Variants
            </p>
            <p className="font-display text-3xl font-bold text-white">{totalVariants}</p>
          </div>
          <div className="bg-[#121212] border border-white/10 p-6">
            <p className="font-sans text-[11px] uppercase tracking-widest text-green-400 mb-1 font-semibold">
              With Barcode
            </p>
            <p className="font-display text-3xl font-bold text-green-300">{withBarcode}</p>
          </div>
          <div className="bg-[#121212] border border-white/10 p-6">
            <p className="font-sans text-[11px] uppercase tracking-widest text-amber-400 mb-1 font-semibold">
              Without Barcode
            </p>
            <p className="font-display text-3xl font-bold text-amber-300">{totalVariants - withBarcode}</p>
          </div>
        </div>

        {/* Search by Barcode */}
        <div className="bg-[#121212] border border-white/10 p-6 mb-10">
          <h2 className="font-display text-lg text-white mb-4">Search by Barcode</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchBarcode}
              onChange={(e) => setSearchBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter barcode number..."
              className="flex-1 bg-[#0a0a0a] border border-white/20 text-white font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-white/30"
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-gold/20 border border-gold text-gold hover:bg-gold hover:text-black font-sans text-xs uppercase tracking-widest px-6 py-3 font-bold transition-colors disabled:opacity-50"
            >
              {searchLoading ? "..." : "SEARCH"}
            </button>
          </div>
          {searchResults !== null && (
            <div className="mt-4">
              {searchResults.length === 0 ? (
                <p className="text-white/40 font-sans text-xs">No products found with this barcode.</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((r: any) => (
                    <div key={r.variant_id} className="bg-[#0a0a0a] border border-gold/30 p-4 flex justify-between items-center">
                      <div>
                        <p className="font-sans text-sm font-semibold text-white">{r.product_title}</p>
                        <p className="font-sans text-xs text-white/50 mt-0.5">
                          Variant: {r.variant_title} • SKU: {r.variant_sku || "—"} • Barcode: {r.variant_barcode}
                        </p>
                      </div>
                      <button
                        onClick={() => viewBarcode(r.variant_barcode, r.product_title, r.variant_title, r.variant_sku || "")}
                        className="text-gold font-sans text-xs uppercase tracking-wider hover:underline"
                      >
                        View Barcode
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product/Variant List */}
        <div className="bg-[#121212] border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-display text-lg text-white">All Products & Variants</h2>
            <p className="font-sans text-xs text-white/40 mt-1">
              Generate, view, print, and download barcodes for each jewellery variant.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-white/40 font-sans text-sm">
              Loading products from Medusa...
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-white/40 font-sans text-sm">
              No products found. Add products in the Medusa admin first.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {products.map((product) => (
                <div key={product.id} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-serif text-base text-white font-medium">{product.title}</h3>
                      <p className="font-sans text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
                        {product.handle} • {product.status}
                      </p>
                    </div>
                  </div>

                  {/* Variants */}
                  <div className="space-y-2 ml-4">
                    {(product.variants || []).map((variant) => (
                      <div
                        key={variant.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#0a0a0a] border border-white/10"
                      >
                        <div className="flex-1">
                          <p className="font-sans text-xs text-white font-medium">
                            {variant.title || "Default Variant"}
                          </p>
                          <p className="font-sans text-[10px] text-white/40 mt-0.5">
                            SKU: {variant.sku || "—"}
                          </p>
                          {variant.barcode && (
                            <p className="font-mono text-sm text-gold mt-1 font-bold">
                              {variant.barcode}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {variant.barcode ? (
                            <>
                              <button
                                onClick={() =>
                                  viewBarcode(variant.barcode!, product.title, variant.title || "Default", variant.sku || "")
                                }
                                className="bg-white/5 border border-white/20 text-white/70 hover:text-gold hover:border-gold font-sans text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => copyBarcode(variant.barcode!)}
                                className="bg-white/5 border border-white/20 text-white/70 hover:text-gold hover:border-gold font-sans text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors"
                              >
                                Copy
                              </button>
                              <button
                                onClick={() => {
                                  viewBarcode(variant.barcode!, product.title, variant.title || "Default", variant.sku || "");
                                  setTimeout(printBarcode, 300);
                                }}
                                className="bg-white/5 border border-white/20 text-white/70 hover:text-gold hover:border-gold font-sans text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors"
                              >
                                Print
                              </button>
                              <button
                                onClick={() => regenerateBarcode(product.id, variant.id)}
                                disabled={generatingFor === variant.id}
                                className="bg-amber-900/30 border border-amber-600/40 text-amber-300 hover:bg-amber-800 font-sans text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors disabled:opacity-50"
                              >
                                {generatingFor === variant.id ? "..." : "Regenerate"}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => generateBarcode(product.id, variant.id)}
                              disabled={generatingFor === variant.id}
                              className="bg-gold/20 border border-gold text-gold hover:bg-gold hover:text-black font-sans text-[10px] uppercase tracking-widest px-4 py-1.5 font-bold transition-colors disabled:opacity-50"
                            >
                              {generatingFor === variant.id ? "Generating..." : "Generate Barcode"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Barcode Viewer Modal */}
      {selectedBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111111] border border-gold/40 shadow-2xl max-w-lg w-full mx-4 p-8">
            <div className="text-center mb-6">
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
                TIRUPATI JEWELLERS
              </p>
              <h3 className="font-serif text-lg text-white mt-2">{selectedBarcode.productTitle}</h3>
              <p className="font-sans text-xs text-white/50 mt-1">
                Variant: {selectedBarcode.variantTitle} • SKU: {selectedBarcode.sku || "—"}
              </p>
            </div>

            <div ref={printRef} className="bg-white p-6 flex justify-center">
              <svg ref={barcodeCanvasRef}></svg>
            </div>

            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              <button
                onClick={downloadBarcode}
                className="bg-gold/20 border border-gold text-gold hover:bg-gold hover:text-black font-sans text-xs uppercase tracking-wider px-4 py-2 font-bold transition-colors"
              >
                ↓ Download PNG
              </button>
              <button
                onClick={printBarcode}
                className="bg-white/5 border border-white/20 text-white/70 hover:text-gold hover:border-gold font-sans text-xs uppercase tracking-wider px-4 py-2 transition-colors"
              >
                🖨 Print Label
              </button>
              <button
                onClick={() => copyBarcode(selectedBarcode.barcode)}
                className="bg-white/5 border border-white/20 text-white/70 hover:text-gold hover:border-gold font-sans text-xs uppercase tracking-wider px-4 py-2 transition-colors"
              >
                📋 Copy
              </button>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => setSelectedBarcode(null)}
                className="font-sans text-xs text-white/40 hover:text-white uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
