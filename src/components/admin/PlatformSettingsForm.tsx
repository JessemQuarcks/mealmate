"use client";
import React, { useEffect, useState } from "react";

const PlatformSettingsForm: React.FC = () => {
  const [serviceFeePercent, setService] = useState(5);
  const [taxPercent, setTax] = useState(0);
  const [currency, setCurrency] = useState("GHS");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => {
        if (!b?.success) throw new Error();
        setService(b.data.serviceFeePercent);
        setTax(b.data.taxPercent);
        setCurrency(b.data.currency);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceFeePercent, taxPercent, currency }),
      });
      const b = await res.json();
      if (!res.ok || !b.success) throw new Error(b.errors?.join(", ") || "Could not save");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (state === "loading") return <div className="h-48 animate-pulse rounded-2xl bg-surface-2" />;
  if (state === "error") return <p className="text-muted">Could not load settings.</p>;

  return (
    <div className="card max-w-md space-y-4">
      <p className="text-sm text-muted">
        These apply to every new checkout — existing orders keep the fees they were charged.
      </p>
      <label className="block text-sm">
        <span className="text-muted">Service fee (% of subtotal)</span>
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          className="input mt-1"
          value={serviceFeePercent}
          onChange={(e) => setService(Math.max(0, Number(e.target.value) || 0))}
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Tax (% of subtotal)</span>
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          className="input mt-1"
          value={taxPercent}
          onChange={(e) => setTax(Math.max(0, Number(e.target.value) || 0))}
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted">Currency</span>
        <input className="input mt-1" value={currency} onChange={(e) => setCurrency(e.target.value)} />
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-brand">Saved ✓</span>}
      </div>
    </div>
  );
};

export default PlatformSettingsForm;
