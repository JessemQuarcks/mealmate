"use client";
import React, { useEffect, useState } from "react";
import { useOwnedRestaurants, MenuItem } from "./useOwnedRestaurants";
import { effectiveItemPrice } from "@/lib/pricing";

const emptyItem = (): MenuItem => ({
  name: "",
  price: 0,
  category: "",
  available: true,
});

export default function MenuManager() {
  const { restaurants, selected, selectedId, setSelectedId, loading, error } =
    useOwnedRestaurants();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(selected?.menu ?? []);
  }, [selected]);

  const update = (i: number, patch: Partial<MenuItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setItems((prev) => [...prev, emptyItem()]);

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/vendor/restaurants/${selectedId}/menu`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu: items }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.join(", ") || "Save failed");
      setItems(body.data);
      setMessage("Menu saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (restaurants.length === 0)
    return (
      <p>
        You don&apos;t manage any restaurants yet. <a href="/vendor/claim" className="text-brand underline">Claim a listing</a> first.
      </p>
    );

  return (
    <div>
      {restaurants.length > 1 && (
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border rounded-lg p-2 mb-4"
        >
          {restaurants.map((r) => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>
      )}

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item.id ?? i} className="border rounded-lg p-3 grid gap-2 sm:grid-cols-12 items-center">
            <input
              className="border rounded p-2 sm:col-span-3" placeholder="Name"
              value={item.name} onChange={(e) => update(i, { name: e.target.value })}
            />
            <input
              className="border rounded p-2 sm:col-span-2" placeholder="Category"
              value={item.category ?? ""} onChange={(e) => update(i, { category: e.target.value })}
            />
            <input
              type="number" min="0" step="0.01" className="border rounded p-2 sm:col-span-2" placeholder="Price"
              value={item.price} onChange={(e) => update(i, { price: parseFloat(e.target.value) || 0 })}
            />
            <input
              type="number" min="0" max="100" className="border rounded p-2 sm:col-span-2" placeholder="% off"
              value={item.discountPercent ?? ""} onChange={(e) => update(i, { discountPercent: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <label className="flex items-center gap-1 text-sm sm:col-span-2">
              <input type="checkbox" checked={item.available !== false}
                onChange={(e) => update(i, { available: e.target.checked })} />
              In stock
            </label>
            <button onClick={() => remove(i)} className="text-red-600 text-sm sm:col-span-1">Remove</button>
            {(item.discountPercent ?? 0) > 0 && (
              <p className="text-xs text-muted sm:col-span-12">
                Sells for GHS {effectiveItemPrice({ price: item.price, discountPercent: item.discountPercent })}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button onClick={add} className="border rounded-lg px-4 py-2">+ Add item</button>
        <button onClick={save} disabled={saving} className="bg-brand text-black rounded-lg px-4 py-2 disabled:opacity-60">
          {saving ? "Saving…" : "Save menu"}
        </button>
        {message && <span className="text-sm text-muted">{message}</span>}
      </div>
    </div>
  );
}
