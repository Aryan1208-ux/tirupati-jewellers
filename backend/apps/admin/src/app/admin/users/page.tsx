"use client";

import React, { useEffect, useState } from "react";
import { RequirePermission } from "@/components/RequirePermission";


const MEDUSA_URL = "/api/medusa";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${MEDUSA_URL}/admin/rbac/users`),
        fetch(`${MEDUSA_URL}/admin/rbac/roles`)
      ]);

      if (!usersRes.ok || !rolesRes.ok) throw new Error("Failed to load data");

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();

      setUsers(usersData.users || []);
      setRoles(rolesData.roles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (userId: string) => {
    try {
      if (!selectedRoleCode) return;
      
      const res = await fetch(`${MEDUSA_URL}/admin/rbac/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: userId, role_code: selectedRoleCode })
      });

      if (!res.ok) throw new Error("Failed to assign role");

      setEditingUserId(null);
      fetchData(); // reload
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <RequirePermission code="users.view" fallback={<div className="p-8 text-red-500 font-mono">Access Denied</div>}>
      <div className="p-8 min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans">
        <h1 className="text-3xl font-bold text-gold uppercase tracking-widest mb-2 font-serif">Admin Users</h1>
        <p className="text-sm text-gray-400 mb-8 max-w-2xl">
          Manage Medusa admin users and their Role-Based Access Control assignments.
        </p>

        {loading ? (
          <div className="text-gold">Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto border border-gold/20 rounded-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gold/10 text-gold text-xs uppercase tracking-widest border-b border-gold/20">
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Current Role</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-sm">{user.email}</td>
                    <td className="p-4 text-sm">{user.first_name} {user.last_name}</td>
                    <td className="p-4 text-sm font-bold text-gold-light">
                      {user.role ? (
                        <span className="px-2 py-1 bg-gold/10 rounded">{user.role.name}</span>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {editingUserId === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={selectedRoleCode}
                            onChange={(e) => setSelectedRoleCode(e.target.value)}
                            className="bg-[#121212] border border-gold/40 text-white p-1 text-sm rounded"
                          >
                            <option value="">Select Role...</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.code}>{r.name}</option>
                            ))}
                          </select>
                          <RequirePermission code="users.manage">
                            <button
                              onClick={() => handleAssignRole(user.id)}
                              className="text-xs bg-gold text-black px-2 py-1 font-bold hover:bg-gold-light"
                            >
                              Save
                            </button>
                          </RequirePermission>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="text-xs text-gray-400 hover:text-white px-2 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <RequirePermission code="users.manage">
                          <button
                            onClick={() => {
                              setEditingUserId(user.id);
                              setSelectedRoleCode(user.role?.code || "");
                            }}
                            className="text-gold hover:text-gold-light underline text-sm"
                          >
                            Change Role
                          </button>
                        </RequirePermission>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RequirePermission>
  );
}
