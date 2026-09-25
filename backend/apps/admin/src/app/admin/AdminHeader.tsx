"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminUser, logoutAdmin } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";

export default function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setAdminUser(getAdminUser());
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    router.push("/admin/login");
  };

  return (
    <header className="bg-[#111111] border-b border-gold/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden text-white hover:text-gold"
        >
          ☰
        </button>
        <div className="hidden sm:block">
          <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50">Tirupati Admin Portal</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
        <a href="http://localhost:3000/" target="_blank" className="text-[10px] font-sans text-white/70 hover:text-gold uppercase tracking-wider hidden sm:block">
          ↗ View Storefront
        </a>
        
        <div className="w-[1px] h-4 bg-white/10 hidden sm:block" />
        
        {adminUser && (
          <span className="text-[10px] font-sans text-gold uppercase tracking-wider hidden sm:block">
            {adminUser}
          </span>
        )}
        
        <button 
          onClick={handleLogout} 
          className="bg-red-900/20 text-red-300 border border-red-700/30 uppercase text-[10px] tracking-wider px-3 py-1.5 hover:bg-red-900/40 hover:text-red-200 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
