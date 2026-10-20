"use client";
import React, { useEffect, useState } from "react";
import { FiDollarSign, FiTrendingUp, FiClock, FiAlertTriangle, FiShoppingBag, FiMapPin } from "react-icons/fi";
import { orderStatusLabel } from "@/lib/orderStatusLabel";

interface Metrics {
  users: { total: number; pending: number; suspended: number; byRole: Record<string, number> };
  orders: { byStatus: Record<string, number>; last7: number; last30: number; openDisputes: number; paid: number };
  money: { gmv: number; platformRevenue: number; currency: string };
  restaurants: { active: number; hidden: number };
}

const Tile: React.FC<{ icon: React.ReactNode; label: string; value: string; hint?: string }> = ({
  icon,
  label,
  value,
  hint,
}) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-brand">{icon}</span>
    </div>
    <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    {hint && <div className="text-xs text-muted">{hint}</div>}
  </div>
);

const BarList: React.FC<{ title: string; data: Record<string, number>; label?: (k: string) => string }> = ({
  title,
  data,
  label,
}) => {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="card">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map(([k, v]) => (
            <li key={k}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize text-muted">{label ? label(k) : k}</span>
                <span className="font-medium">{v}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${(v / max) * 100}%` }}
                  role="img"
                  aria-label={`${label ? label(k) : k}: ${v}`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AdminMetrics: React.FC = () => {
  const [m, setM] = useState<Metrics | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    fetch("/api/admin/metrics", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => {
        if (!b?.success) throw new Error();
        setM(b.data);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  if (state === "loading")
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    );
  if (state === "error" || !m) return <p className="text-muted">Could not load metrics.</p>;

  const cur = m.money.currency;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile icon={<FiTrendingUp />} label="GMV (paid)" value={`${cur} ${m.money.gmv.toLocaleString()}`} />
        <Tile icon={<FiDollarSign />} label="Platform revenue" value={`${cur} ${m.money.platformRevenue.toLocaleString()}`} hint="service fees on paid orders" />
        <Tile icon={<FiShoppingBag />} label="Paid orders" value={String(m.orders.paid)} hint={`${m.orders.last7} in last 7 days`} />
        <Tile icon={<FiClock />} label="Pending approvals" value={String(m.users.pending)} hint={`${m.users.total} users total`} />
        <Tile icon={<FiAlertTriangle />} label="Open disputes" value={String(m.orders.openDisputes)} />
        <Tile icon={<FiMapPin />} label="Live restaurants" value={String(m.restaurants.active)} hint={`${m.restaurants.hidden} hidden`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Orders by status" data={m.orders.byStatus} label={orderStatusLabel} />
        <BarList title="Users by role" data={m.users.byRole} />
      </div>
    </div>
  );
};

export default AdminMetrics;
