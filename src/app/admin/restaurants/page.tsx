"use client";
import React, { useCallback, useEffect, useState } from "react";

interface AdminRestaurant {
  _id: string;
  name: string;
  status: string;
  deliveryFee?: number;
  rating?: number;
  ratingCount?: number;
  source?: string;
}

export default function AdminRestaurantsPage() {
  const [rows, setRows] = useState<AdminRestaurant[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    try {
      const res = await fetch(`/api/admin/restaurants?${sp.toString()}`, { cache: "no-store" });
      const body = await res.json();
      setRows(body?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const setStatus = async (id: string, status: "active" | "hidden") => {
    setBusyId(id);
    try {
      await fetch(`/api/admin/restaurants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const seedLocal = async () => {
    setNote("Seeding local dataset…");
    try {
      const res = await fetch("/api/admin/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "local" }),
      });
      const body = await res.json();
      setNote(body?.success ? `Seeded ${body.data.upserted} restaurants` : "Seed failed");
      await load();
    } catch {
      setNote("Seed failed");
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mb-1 font-display text-xl font-bold">Catalogue</h2>
          <p className="text-muted">Hide/unhide restaurants and seed data. Hidden ones drop from discovery.</p>
        </div>
        <button className="btn-outline" onClick={seedLocal}>Run local seed</button>
      </div>

      {note && <p className="mb-3 text-sm text-brand">{note}</p>}
      <input className="input mb-4 max-w-sm" placeholder="Search restaurants…" value={q} onChange={(e) => setQ(e.target.value)} />

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
      ) : rows.length === 0 ? (
        <p className="text-muted">No restaurants. Run the local seed to populate.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-muted">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Delivery</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t border-line">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.rating ? `${r.rating.toFixed(1)} (${r.ratingCount ?? 0})` : "—"}</td>
                  <td className="p-3">GHS {r.deliveryFee ?? 0}</td>
                  <td className="p-3">
                    <span className={`badge ${r.status === "active" ? "bg-green-100 text-green-700" : "bg-surface-2 text-muted"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {r.status === "active" ? (
                      <button className="font-medium text-red-500 disabled:opacity-50" disabled={busyId === r._id} onClick={() => setStatus(r._id, "hidden")}>
                        Hide
                      </button>
                    ) : (
                      <button className="font-medium text-brand disabled:opacity-50" disabled={busyId === r._id} onClick={() => setStatus(r._id, "active")}>
                        Unhide
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
