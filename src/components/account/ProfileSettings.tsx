"use client";
import React, { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";

interface Address {
  label?: string;
  line1: string;
  line2?: string;
  city?: string;
}

interface Profile {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  addresses: Address[];
}

const ProfileSettings: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => {
        if (!b?.success) throw new Error("Failed");
        const p: Profile = b.data;
        setProfile(p);
        setName(p.name);
        setPhone(p.phone);
        setAddresses(p.addresses ?? []);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  const updateAddress = (i: number, patch: Partial<Address>) =>
    setAddresses((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  const addAddress = () => setAddresses((prev) => [...prev, { label: "", line1: "", city: "" }]);
  const removeAddress = (i: number) => setAddresses((prev) => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          addresses: addresses.filter((a) => a.line1.trim()),
        }),
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

  if (state === "loading") return <p className="text-muted">Loading your profile…</p>;
  if (state === "error" || !profile)
    return <p className="text-muted">Could not load your profile. Please sign in and retry.</p>;

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h2 className="font-display text-lg font-bold">Personal details</h2>
        <label className="block text-sm">
          <span className="text-muted">Full name</span>
          <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Email</span>
          <input className="input mt-1 opacity-60" value={profile.email} disabled />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Phone</span>
          <input
            className="input mt-1"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 024 000 0000"
          />
        </label>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Delivery addresses</h2>
          <button className="btn-ghost" onClick={addAddress}>
            <FiPlus /> Add
          </button>
        </div>
        {addresses.length === 0 && <p className="text-sm text-muted">No saved addresses yet.</p>}
        {addresses.map((a, i) => (
          <div key={i} className="rounded-xl border border-line p-4">
            <div className="mb-2 flex items-center justify-between">
              <input
                className="input max-w-[200px]"
                placeholder="Label (Home, Work…)"
                value={a.label ?? ""}
                onChange={(e) => updateAddress(i, { label: e.target.value })}
              />
              <button
                className="text-red-500 hover:text-red-400"
                onClick={() => removeAddress(i)}
                aria-label="Remove address"
              >
                <FiTrash2 />
              </button>
            </div>
            <input
              className="input mb-2"
              placeholder="Address line *"
              value={a.line1}
              onChange={(e) => updateAddress(i, { line1: e.target.value })}
            />
            <input
              className="input"
              placeholder="City"
              value={a.city ?? ""}
              onChange={(e) => updateAddress(i, { city: e.target.value })}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-sm text-brand">Saved ✓</span>}
      </div>
    </div>
  );
};

export default ProfileSettings;
