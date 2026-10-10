"use client";
import React, { useEffect, useState, useCallback } from "react";

interface OrderProduct {
  name: string;
  quantity: number;
  price: number;
}
interface VendorOrder {
  _id: string;
  status: string;
  total_amount: number;
  products: OrderProduct[];
  createdAt?: string;
}

// Which next-states a vendor can set from a given status.
const ACTIONS: Record<string, { label: string; to: string; style: string }[]> = {
  placed: [
    { label: "Accept", to: "accepted", style: "text-green-700" },
    { label: "Reject", to: "rejected", style: "text-red-700" },
  ],
  accepted: [{ label: "Start preparing", to: "preparing", style: "text-blue-700" }],
  preparing: [{ label: "Mark ready", to: "ready", style: "text-blue-700" }],
};

export default function VendorOrders() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/orders");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.join(", ") || "Failed to load orders");
      setOrders(body.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/vendor/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.errors?.join(", ") || "Update failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <p>Loading orders…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (orders.length === 0) return <p>No orders yet.</p>;

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o._id} className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium capitalize">{o.status.replace(/_/g, " ")}</span>
            <span className="text-gray-600">GHS {o.total_amount}</span>
          </div>
          <ul className="text-sm text-gray-700 mb-3">
            {o.products.map((p, i) => (
              <li key={i}>{p.quantity} × {p.name}</li>
            ))}
          </ul>
          <div className="flex gap-4">
            {(ACTIONS[o.status] ?? []).map((a) => (
              <button
                key={a.to}
                disabled={busy === o._id}
                onClick={() => setStatus(o._id, a.to)}
                className={`${a.style} underline text-sm disabled:opacity-50`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
