"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const MEDUSA_BACKEND = "http://localhost:9000";

interface ScanResult {
  product_id: string;
  product_title: string;
  product_handle: string;
  product_thumbnail: string | null;
  product_status: string;
  variant_id: string;
  variant_title: string;
  variant_sku: string | null;
  variant_barcode: string;
}

export default function BarcodeScannerPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
    } else {
      setAuthenticated(true);
    }

    return () => {
      stopScanner();
    };
  }, [router]);

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

  const lookupBarcode = async (barcode: string) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const token = await getAdminToken();
      const res = await fetch(
        `${MEDUSA_BACKEND}/admin/barcodes?barcode=${encodeURIComponent(barcode)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        setResult(data.results[0]);
      } else {
        setError(`No product found for barcode: ${barcode}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to look up barcode");
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setCameraError("");
    setResult(null);
    setError("");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // Already stopped
        }
      }

      const scanner = new Html5Qrcode("barcode-scanner-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 1.777,
        },
        async (decodedText: string) => {
          // Successfully scanned
          setScanning(false);
          try {
            await scanner.stop();
          } catch {
            // Ignore
          }
          setManualCode(decodedText);
          await lookupBarcode(decodedText);
        },
        () => {
          // QR code scan failure (ignore - still scanning)
        }
      );

      setScanning(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(
        err.message?.includes("NotAllowed")
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : err.message?.includes("NotFound")
          ? "No camera found on this device. Use manual entry below."
          : `Camera error: ${err.message || "Unknown error"}`
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Already stopped
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSearch = async () => {
    if (!manualCode.trim()) return;
    await lookupBarcode(manualCode.trim());
  };

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
          <span className="text-2xl text-gold">📷</span>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.2em] text-white">
              BARCODE SCANNER
            </h1>
            <p className="font-sans text-[9px] uppercase tracking-[0.35em] text-gold font-semibold">
              SCAN OR ENTER BARCODE TO FIND JEWELLERY
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/barcodes"
            className="border border-white/20 text-white/60 hover:text-gold font-sans text-xs uppercase tracking-wider px-3 py-1.5 transition-colors"
          >
            ← Barcode Management
          </Link>
          <Link
            href="/admin"
            className="border border-white/20 text-white/60 hover:text-gold font-sans text-xs uppercase tracking-wider px-3 py-1.5 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Camera Scanner */}
        <div className="bg-[#121212] border border-white/10 p-6 mb-8">
          <h2 className="font-display text-lg text-white mb-4">Camera Scanner</h2>

          <div className="flex gap-3 mb-4">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="bg-gold/20 border border-gold text-gold hover:bg-gold hover:text-black font-sans text-xs uppercase tracking-widest px-6 py-3 font-bold transition-colors"
              >
                📷 Start Camera
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="bg-red-900/30 border border-red-600/40 text-red-300 hover:bg-red-800 font-sans text-xs uppercase tracking-widest px-6 py-3 font-bold transition-colors"
              >
                ■ Stop Camera
              </button>
            )}
          </div>

          {cameraError && (
            <div className="bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-sans p-4 mb-4">
              {cameraError}
            </div>
          )}

          <div
            id="barcode-scanner-container"
            ref={scannerContainerRef}
            className={`bg-black overflow-hidden ${scanning ? "h-[300px]" : "h-0"} transition-all duration-300`}
          ></div>

          {scanning && (
            <p className="text-white/40 font-sans text-xs mt-3 text-center animate-pulse">
              Point your camera at a barcode...
            </p>
          )}
        </div>

        {/* Manual Entry */}
        <div className="bg-[#121212] border border-white/10 p-6 mb-8">
          <h2 className="font-display text-lg text-white mb-4">Manual Entry</h2>
          <p className="font-sans text-xs text-white/40 mb-4">
            If no camera is available, type or paste the barcode number below.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              placeholder="Enter barcode number..."
              className="flex-1 bg-[#0a0a0a] border border-white/20 text-white font-mono text-sm px-4 py-3 focus:outline-none focus:border-gold placeholder:text-white/30"
            />
            <button
              onClick={handleManualSearch}
              disabled={loading || !manualCode.trim()}
              className="bg-gold/20 border border-gold text-gold hover:bg-gold hover:text-black font-sans text-xs uppercase tracking-widest px-6 py-3 font-bold transition-colors disabled:opacity-50"
            >
              {loading ? "..." : "LOOK UP"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-sans p-4 mb-8 flex items-center gap-2">
            <span>✕</span> {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-[#121212] border border-gold/30 p-8 text-center mb-8">
            <p className="text-gold font-sans text-sm animate-pulse">
              Searching for product...
            </p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-[#121212] border border-gold/40 shadow-xl overflow-hidden">
            <div className="bg-gold/10 border-b border-gold/30 p-4">
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
                ✓ PRODUCT FOUND
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-6">
                {result.product_thumbnail && (
                  <div className="w-20 h-20 bg-[#0a0a0a] border border-gold/30 overflow-hidden flex-shrink-0">
                    <img
                      src={result.product_thumbnail}
                      alt={result.product_title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-serif text-xl text-white font-medium">
                    {result.product_title}
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2 mt-3 font-sans text-xs">
                    <div>
                      <span className="text-white/40 uppercase tracking-wider">Variant</span>
                      <p className="text-white mt-0.5">{result.variant_title}</p>
                    </div>
                    <div>
                      <span className="text-white/40 uppercase tracking-wider">SKU</span>
                      <p className="text-white mt-0.5">{result.variant_sku || "—"}</p>
                    </div>
                    <div>
                      <span className="text-white/40 uppercase tracking-wider">Barcode</span>
                      <p className="text-gold font-mono font-bold mt-0.5">{result.variant_barcode}</p>
                    </div>
                    <div>
                      <span className="text-white/40 uppercase tracking-wider">Status</span>
                      <p className="text-white mt-0.5 capitalize">{result.product_status}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 flex-wrap">
                <a
                  href={`http://localhost:9000/app/products/${result.product_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gold/20 border border-gold text-gold hover:bg-gold hover:text-black font-sans text-xs uppercase tracking-wider px-4 py-2 font-bold transition-colors"
                >
                  Open in Medusa ↗
                </a>
                <Link
                  href="/admin/barcodes"
                  className="bg-white/5 border border-white/20 text-white/70 hover:text-gold hover:border-gold font-sans text-xs uppercase tracking-wider px-4 py-2 transition-colors"
                >
                  Manage Barcodes
                </Link>
                <button
                  onClick={() => {
                    setResult(null);
                    setManualCode("");
                    setError("");
                  }}
                  className="bg-white/5 border border-white/20 text-white/70 hover:text-gold hover:border-gold font-sans text-xs uppercase tracking-wider px-4 py-2 transition-colors"
                >
                  Scan Another
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
