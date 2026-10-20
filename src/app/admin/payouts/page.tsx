"use client";
import React, { useCallback, useEffect, useState } from "react";

interface SummaryRow {
  vendorUserId: string;
  restaurantName?: string;
  gross: number;
  paid: number;
  net: number;
  orderCount: number;
}

interface LedgerRow {
  _id: string;
  vendorUserId: string;
  amount: number;
  orderCount: number;
  note?: string;
  paidAt: string;
}

export default function AdminPayoutsPage() {
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payouts", { cache: "no-store" });
      const body = await res.json();
      setSummary(body?.data?.summary ?? []);
      setLedger(body?.data?.ledger ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markPaid = async (row: SummaryRow) => {
    setBusyId(row.vendorUserId);
    try {
      await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorUserId: row.vendorUserId,
          amount: row.net,
          orderCount: row.orderCount,
          note: `Settled ${row.restaurantName ?? row.vendorUserId}`,
        }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-1 font-display text-xl font-bold">Payouts</h2>
        <p className="mb-5 text-muted">Owed per vendor (food + tips on delivered, paid orders), net of past payouts.</p>

        {loading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
        ) : summary.length === 0 ? (
          <p className="text-muted">Nothing owed right now.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-muted">
                <tr>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Earned</th>
                  <th className="p-3">Paid</th>
                  <th className="p-3">Owed</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {summary.map((r) => (
                  <tr key={r.vendorUserId} className="border-t border-line">
                    <td className="p-3">{r.restaurantName || r.vendorUserId}</td>
                    <td className="p-3">{r.orderCount}</td>
                    <td className="p-3">GHS {r.gross}</td>
                    <td className="p-3 text-muted">GHS {r.paid}</td>
                    <td className="p-3 font-semibold">GHS {r.net}</td>
                    <td className="p-3">
                      {r.net > 0 ? (
                        <button
                          className="btn-primary"
                          disabled={busyId === r.vendorUserId}
                          onClick={() => markPaid(r)}
                        >
                          Mark paid
                        </button>
                      ) : (
                        <span className="text-muted">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-semibold">Recent payouts</h3>
        {ledger.length === 0 ? (
          <p className="text-muted">No payouts recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {ledger.map((l) => (
              <li key={l._id} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-2 text-sm">
                <span>{l.note || l.vendorUserId}</span>
                <span className="text-muted">
                  GHS {l.amount} · {new Date(l.paidAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
