"use client";
import React, { useEffect, useState } from "react";
import { useOwnedRestaurants } from "./useOwnedRestaurants";

export default function StorefrontSettings() {
  const { restaurants, selected, selectedId, setSelectedId, loading, error } =
    useOwnedRestaurants();

  const [isOpen, setIsOpen] = useState(true);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [prepTimeMinutes, setPrepTime] = useState(30);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [promoLabel, setPromoLabel] = useState("");
  const [promoPercent, setPromoPercent] = useState(0);
  const [promoActive, setPromoActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    setIsOpen(selected.isOpen);
    setAcceptingOrders(selected.acceptingOrders);
    setPrepTime(selected.prepTimeMinutes);
    setDeliveryFee(selected.deliveryFee);
    setPromoLabel(selected.promotion?.label ?? "");
    setPromoPercent(selected.promotion?.percentOff ?? 0);
    setPromoActive(selected.promotion?.active ?? false);
  }, [selected]);

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/vendor/restaurants/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isOpen,
          acceptingOrders,
          prepTimeMinutes,
          deliveryFee,
          promotion: { label: promoLabel, percentOff: promoPercent, active: promoActive },
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.join(", ") || "Save failed");
      setMessage("Settings saved.");
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
        You don&apos;t manage any restaurants yet. <a href="/vendor/claim" className="text-blue-600 underline">Claim a listing</a> first.
      </p>
    );

  return (
    <div className="max-w-lg space-y-4">
      {restaurants.length > 1 && (
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="border rounded-lg p-2">
          {restaurants.map((r) => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>
      )}

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} />
        Open now
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={acceptingOrders} onChange={(e) => setAcceptingOrders(e.target.checked)} />
        Accepting orders
      </label>

      <div>
        <label htmlFor="prep" className="block text-sm font-medium mb-1">Prep time (minutes)</label>
        <input id="prep" type="number" min="0" max="240" value={prepTimeMinutes}
          onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)} className="border rounded-lg p-2 w-32" />
      </div>

      <div>
        <label htmlFor="fee" className="block text-sm font-medium mb-1">Delivery fee (GHS)</label>
        <input id="fee" type="number" min="0" step="0.01" value={deliveryFee}
          onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)} className="border rounded-lg p-2 w-32" />
      </div>

      <fieldset className="border rounded-lg p-3">
        <legend className="text-sm font-medium px-1">Promotion</legend>
        <input className="border rounded-lg p-2 w-full mb-2" placeholder="Label (e.g. Lunch special)"
          value={promoLabel} onChange={(e) => setPromoLabel(e.target.value)} />
        <div className="flex items-center gap-3">
          <input type="number" min="0" max="100" value={promoPercent}
            onChange={(e) => setPromoPercent(parseFloat(e.target.value) || 0)} className="border rounded-lg p-2 w-24" />
          <span className="text-sm">% off</span>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={promoActive} onChange={(e) => setPromoActive(e.target.checked)} />
            Active
          </label>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-60">
          {saving ? "Saving…" : "Save settings"}
        </button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </div>
  );
}
