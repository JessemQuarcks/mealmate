"use client";
import React, { useState } from "react";

interface SearchResult {
  _id: string;
  name: string;
  category?: string;
  address?: string;
  ownerUserId?: string;
}

export default function ClaimRestaurant() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/restaurants?q=${encodeURIComponent(q)}&limit=25`);
      const body = await res.json();
      setResults(body?.data ?? []);
    } finally {
      setSearching(false);
    }
  };

  const claim = async (id: string) => {
    setBusy(id);
    setMessage(null);
    try {
      const res = await fetch("/api/vendor/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.join(", ") || "Claim failed");
      setMessage(`Claimed "${body.data.name}". Manage it from the Menu and Settings tabs.`);
      setResults((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-xl">
      <p className="text-muted mb-4">
        Find your restaurant below and claim it to manage its menu, prices and availability.
      </p>
      <form onSubmit={search} className="flex gap-2 mb-4">
        <input
          className="border rounded-lg p-2 flex-grow"
          placeholder="Search by name or category"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" disabled={searching} className="bg-brand text-black rounded-lg px-4 disabled:opacity-60">
          {searching ? "…" : "Search"}
        </button>
      </form>

      {message && <p className="text-sm mb-4 text-muted">{message}</p>}

      <ul className="space-y-2">
        {results.map((r) => (
          <li key={r._id} className="border rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-sm text-muted">{r.category || r.address || ""}</p>
            </div>
            {r.ownerUserId ? (
              <span className="text-sm text-muted">Already claimed</span>
            ) : (
              <button disabled={busy === r._id} onClick={() => claim(r._id)}
                className="text-brand underline text-sm disabled:opacity-50">
                Claim
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
