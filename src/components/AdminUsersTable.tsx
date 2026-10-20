"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";

interface AdminUser {
  _id: string;
  name?: string;
  email: string;
  role: string;
  status: string;
}

const ROLES = ["client", "vendor", "courier", "admin"];

export default function AdminUsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

  const patch = async (userId: string, update: { status?: string; role?: string }) => {
    setBusyId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...update }),
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const statusClass = (s: string) =>
    s === "active"
      ? "bg-green-100 text-green-700"
      : s === "pending"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <div>
      <input
        className="input mb-4 max-w-sm"
        placeholder="Search by name or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="mb-3 text-red-500">{error}</p>}
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
      ) : filtered.length === 0 ? (
        <p className="text-muted">No matching users.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-muted">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-t border-line">
                  <td className="p-3">{u.name || "—"}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select
                      className="input py-1"
                      value={u.role}
                      disabled={busyId === u._id}
                      onChange={(e) => patch(u._id, { role: e.target.value })}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <span className={`badge capitalize ${statusClass(u.status)}`}>{u.status}</span>
                  </td>
                  <td className="space-x-3 p-3">
                    {u.status !== "active" && (
                      <button
                        disabled={busyId === u._id}
                        onClick={() => patch(u._id, { status: "active" })}
                        className="font-medium text-brand disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {u.status !== "suspended" && (
                      <button
                        disabled={busyId === u._id}
                        onClick={() => patch(u._id, { status: "suspended" })}
                        className="font-medium text-red-500 disabled:opacity-50"
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
      )}
    </div>
  );
}
