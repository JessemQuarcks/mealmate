"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { ORDER_STATUSES } from "@/lib/orderStatus";

interface AdminOrderRow {
  _id: string;
  restaurant_name?: string;
  total_amount: number;
  currency?: string;
  status: string;
  payment?: { status?: string };
  dispute?: { status?: string };
  createdAt?: string;
}

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<AdminOrderRow[]>([]);
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [dispute, setDispute] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (payment) sp.set("payment", payment);
    if (dispute) sp.set("dispute", dispute);
    if (q) sp.set("q", q);
    try {
      const res = await fetch(`/api/admin/orders?${sp.toString()}`, { cache: "no-store" });
      const body = await res.json();
      setRows(body?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [status, payment, dispute, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <h2 className="mb-1 font-display text-xl font-bold">Orders</h2>
      <p className="mb-5 text-muted">Filter, inspect, refund and resolve disputes.</p>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input className="input" placeholder="Search restaurant or id…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select className="input" value={payment} onChange={(e) => setPayment(e.target.value)}>
          <option value="">Any payment</option>
          {["pending", "paid", "failed", "refunded"].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className="input" value={dispute} onChange={(e) => setDispute(e.target.value)}>
          <option value="">Any dispute</option>
          <option value="open">Disputes: open</option>
          <option value="resolved">Disputes: resolved</option>
          <option value="rejected">Disputes: rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
      ) : rows.length === 0 ? (
        <p className="text-muted">No orders match.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-muted">
              <tr>
                <th className="p-3">Restaurant</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Dispute</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o._id} className="border-t border-line">
                  <td className="p-3">{o.restaurant_name || "—"}</td>
                  <td className="p-3 font-medium">{o.currency ?? "GHS"} {o.total_amount}</td>
                  <td className="p-3"><StatusBadge status={o.status} /></td>
                  <td className="p-3 capitalize">{o.payment?.status ?? "—"}</td>
                  <td className="p-3">
                    {o.dispute?.status === "open" ? (
                      <span className="badge bg-red-100 text-red-700">open</span>
                    ) : (
                      <span className="text-muted">{o.dispute?.status ?? "—"}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Link href={`/admin/orders/${o._id}`} className="font-medium text-brand">
                      View →
                    </Link>
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
