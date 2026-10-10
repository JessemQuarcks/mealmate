"use client";
import React, { useEffect, useState, useCallback } from "react";

interface AdminUser {
  _id: string;
  name?: string;
  email: string;
  role: string;
  status: string;
}

export default function AdminUsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.join(", ") || "Failed to load users");
      setUsers(body.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (userId: string, status: string) => {
    setBusyId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.errors?.join(", ") || "Update failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p>Loading users…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (users.length === 0) return <p>No users yet.</p>;

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-t">
              <td className="p-3">{u.name || "—"}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3 capitalize">{u.role}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                    u.status === "active"
                      ? "bg-green-100 text-green-700"
                      : u.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {u.status}
                </span>
              </td>
              <td className="p-3 space-x-2">
                {u.status !== "active" && (
                  <button
                    disabled={busyId === u._id}
                    onClick={() => updateStatus(u._id, "active")}
                    className="text-green-700 underline disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {u.status !== "suspended" && (
                  <button
                    disabled={busyId === u._id}
                    onClick={() => updateStatus(u._id, "suspended")}
                    className="text-red-700 underline disabled:opacity-50"
                  >
                    Suspend
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
