"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Verify credentials (support standard admin or custom entered)
    setTimeout(() => {
      if (
        (email.trim().toLowerCase() === "tjewellers13@gmail.com" && password === "9431002445@Tjewels.") ||
        (email.includes("@") && password.length >= 4)
      ) {
        localStorage.setItem("tj_admin_authenticated", "true");
        localStorage.setItem("tj_admin_user", email);
        router.push("/admin");
      } else {
        setError("Invalid email or password. Please try again or use the demo login.");
        setLoading(false);
      }
    }, 600);
  };

  const handleDemoFill = () => {
    setEmail("Tjewellers13@gmail.com");
    setPassword("9431002445@Tjewels.");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col justify-center items-center py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Gold Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#111111] border border-gold/40 mb-4 shadow-xl">
            <span className="text-3xl text-gold">👑</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[0.2em] text-white">
            TIRUPATI
          </h1>
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-gold font-bold mt-1">
            ADMINISTRATION PORTAL
          </p>
          <div className="w-16 h-[1px] bg-gold/40 mx-auto mt-4" />
        </div>

        {/* Login Box */}
        <div className="bg-[#111111] border border-gold/30 p-8 sm:p-10 shadow-2xl backdrop-blur-md">
          
          <div className="mb-6 text-center">
            <h2 className="font-serif text-xl text-white font-normal">
              Sign In to Jewellery Manager
            </h2>
            <p className="font-sans text-xs text-white/50 mt-1">
              Add and manage gold, diamonds & bridal suites live on the storefront.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-900/40 border border-red-500/50 text-red-200 text-xs font-sans text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block font-sans text-[11px] uppercase tracking-wider text-gold-light font-semibold mb-1.5">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tjewellers13@gmail.com"
                className="w-full bg-[#181818] border border-white/20 px-4 py-3 text-white text-xs font-sans focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block font-sans text-[11px] uppercase tracking-wider text-gold-light font-semibold mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#181818] border border-white/20 px-4 py-3 text-white text-xs font-sans focus:outline-none focus:border-gold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light text-[#070707] py-3.5 font-sans text-xs tracking-[0.2em] uppercase font-bold transition-all duration-300 shadow-xl disabled:opacity-50 mt-2"
            >
              {loading ? "AUTHENTICATING..." : "ENTER ADMIN PORTAL"}
            </button>
          </form>

          {/* Quick Demo Login Credentials */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={handleDemoFill}
              className="font-sans text-xs text-gold-light hover:text-white underline tracking-wider"
            >
              ⚡ Click here to auto-fill Admin Credentials
            </button>
            <div className="mt-2 text-[10px] font-mono text-white/40">
              Tjewellers13@gmail.com / 9431002445@Tjewels.
            </div>
          </div>

        </div>

        <div className="text-center mt-8">
          <a
            href="http://localhost:3000/"
            className="font-sans text-xs text-white/60 hover:text-gold tracking-widest uppercase"
          >
            ← Return to Public Storefront
          </a>
        </div>

      </div>

    </div>
  );
}
