"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequirePermission } from "@/components/RequirePermission";

export default function AdminSidebar({ open, setOpen }: { open: boolean, setOpen: (v: boolean) => void }) {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Gold / Silver Rates", href: "/admin/rates", icon: "📈", permission: "gold_rates.view" },
    { name: "Billing", href: "/admin/billing", icon: "🧾", permission: "billing.view" },
    { name: "Barcodes", href: "/admin/barcodes", icon: "🏷️", permission: "barcode.view" },
    { name: "Users & Roles", href: "/admin/users", icon: "👥", permission: "users.view" }
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-gold/20 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
      ${open ? "translate-x-0" : "-translate-x-full"}
    `}>
      <div className="h-full flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-gold/10 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="text-2xl text-gold">👑</span>
            <div>
              <h2 className="font-display text-sm font-bold tracking-[0.2em] text-white leading-tight">TIRUPATI</h2>
              <p className="font-sans text-[8px] uppercase tracking-[0.3em] text-gold font-semibold mt-0.5">ADMINISTRATION</p>
            </div>
          </Link>
          <button className="md:hidden text-white/50 hover:text-white" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          <div className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));
              const LinkItem = () => (
                <Link 
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors
                    ${isActive ? "bg-gold/10 text-gold border border-gold/30" : "text-white/60 hover:bg-[#161616] hover:text-white border border-transparent"}`}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.name}
                </Link>
              );

              if (link.permission) {
                return (
                  <RequirePermission key={link.href} code={link.permission}>
                    <LinkItem />
                  </RequirePermission>
                );
              }

              return <LinkItem key={link.href} />;
            })}
          </div>

          <div>
            <h3 className="px-4 text-[10px] font-sans font-bold uppercase tracking-widest text-white/30 mb-2">Customer Engagement</h3>
            <div className="space-y-1">
              <Link 
                href="/admin/engagement/greetings"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors
                  ${pathname?.startsWith("/admin/engagement/greetings") ? "bg-gold/10 text-gold border border-gold/30" : "text-white/60 hover:bg-[#161616] hover:text-white border border-transparent"}`}
              >
                <span className="text-base">💌</span>
                Greetings
              </Link>
              <Link 
                href="/admin/engagement/festivals"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors
                  ${pathname?.startsWith("/admin/engagement/festivals") ? "bg-gold/10 text-gold border border-gold/30" : "text-white/60 hover:bg-[#161616] hover:text-white border border-transparent"}`}
              >
                <span className="text-base">✨</span>
                Festivals
              </Link>
              <Link 
                href="/admin/engagement/settings"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors
                  ${pathname?.startsWith("/admin/engagement/settings") ? "bg-gold/10 text-gold border border-gold/30" : "text-white/60 hover:bg-[#161616] hover:text-white border border-transparent"}`}
              >
                <span className="text-base">⚙️</span>
                Settings
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}
