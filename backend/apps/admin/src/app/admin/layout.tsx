"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/app/admin/AdminSidebar";
import AdminHeader from "@/app/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [permsLoaded, setPermsLoaded] = useState(false);
  
  React.useEffect(() => {
    if (pathname === "/admin/login") return;
    
    // Auto-sync permissions on mount to prevent stale localStorage after backend role changes
    fetch("/api/medusa/admin/my-access")
      .then(res => res.json())
      .then(data => {
        if (data.permissions) {
          const oldPerms = localStorage.getItem("tj_admin_permissions");
          const newPerms = JSON.stringify(data.permissions);
          if (oldPerms !== newPerms) {
            localStorage.setItem("tj_admin_permissions", newPerms);
            if (data.role) {
              localStorage.setItem("tj_admin_role", JSON.stringify(data.role));
            }
          }
        }
        setPermsLoaded(true);
      })
      .catch(() => setPermsLoaded(true));
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!permsLoaded) {
    return <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center text-gold text-xs tracking-widest uppercase">Verifying Access...</div>;
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
