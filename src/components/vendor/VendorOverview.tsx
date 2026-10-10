"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Analytics {
  restaurants: number;
  menuItems: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
}

export default function VendorOverview() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/analytics")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body?.errors?.join(", ") || "Failed to load");
        setData(body.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  if (data.restaurants === 0) {
    return (
      <div className="border rounded-lg p-6 text-center">
        <p className="mb-3">You don&apos;t manage any restaurants yet.</p>
        <Link href="/vendor/claim" className="bg-blue-600 text-white rounded-lg px-4 py-2 inline-block">
          Claim your listing
        </Link>
      </div>
    );
  }

  const cards = [
    { label: "Restaurants", value: data.restaurants },
    { label: "Menu items", value: data.menuItems },
    { label: "Total orders", value: data.totalOrders },
    { label: "Pending orders", value: data.pendingOrders },
    { label: "Revenue (GHS)", value: data.revenue },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="border rounded-lg p-4">
          <div className="text-2xl font-bold">{c.value}</div>
          <div className="text-sm text-gray-500">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
