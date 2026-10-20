"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { describeEvent } from "@/lib/orderEvents";

interface AdminOrder {
  _id: string;
  restaurant_name?: string;
  user_id?: string;
  products?: { id: string; name: string; quantity: number; price: number }[];
  subtotal?: number;
  delivery_fee?: number;
  service_fee?: number;
  tax?: number;
  tip?: number;
  total_amount: number;
  currency?: string;
  status: string;
  payment?: { status?: string; reference?: string; amountMinor?: number };
  refund?: { amountMinor: number; reason?: string };
  courier?: { name?: string };
  delivery_address?: { line1?: string; city?: string };
  events?: { type: string; at: string; note?: string }[];
  dispute?: { status: string; reason: string; note?: string; raisedAt?: string };
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const AdminOrderDetail: React.FC<{ orderId: string }> = ({ orderId }) => {
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [refundOnResolve, setRefundOnResolve] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error();
      setOrder(body.data);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<Response>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.errors?.join(", ") || "Action failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const refund = () =>
    act(() =>
      fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: note || "Admin refund" }),
      })
    );

  const reverify = () =>
    act(() => fetch(`/api/admin/orders/${orderId}/verify`, { method: "POST" }));

  const resolveDispute = (status: "resolved" | "rejected") =>
    act(() =>
      fetch(`/api/admin/orders/${orderId}/dispute`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note || undefined, refund: status === "resolved" && refundOnResolve }),
      })
    );

  if (state === "loading") return <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />;
  if (state === "error" || !order) return <p className="text-muted">Could not load this order.</p>;

  const cur = order.currency ?? "GHS";
  const paid = order.payment?.status === "paid";
  const pending = order.payment?.status === "pending";

  return (
    <div className="space-y-5">
      <Link href="/admin/orders" className="text-sm text-muted hover:text-brand">← All orders</Link>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{order.restaurant_name || "Order"}</h2>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-xs text-muted">#{order._id}</p>
        <div className="mt-4 space-y-1">
          <Row label="Subtotal" value={`${cur} ${order.subtotal ?? 0}`} />
          <Row label="Delivery" value={`${cur} ${order.delivery_fee ?? 0}`} />
          <Row label="Service fee" value={`${cur} ${order.service_fee ?? 0}`} />
          {order.tax ? <Row label="Tax" value={`${cur} ${order.tax}`} /> : null}
          {order.tip ? <Row label="Tip" value={`${cur} ${order.tip}`} /> : null}
          <div className="border-t border-line pt-1">
            <Row label="Total" value={<b>{cur} {order.total_amount}</b>} />
          </div>
          <Row label="Payment" value={<span className="capitalize">{order.payment?.status ?? "—"}</span>} />
          {order.courier?.name && <Row label="Courier" value={order.courier.name} />}
        </div>
      </div>

      {order.dispute && (
        <div className="card border-red-300/40">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Dispute</h3>
            <span className={`badge ${order.dispute.status === "open" ? "bg-red-100 text-red-700" : "bg-surface-2 text-muted"}`}>
              {order.dispute.status}
            </span>
          </div>
          <p className="mt-2 text-sm"><b>{order.dispute.reason}</b></p>
          {order.dispute.note && <p className="text-sm text-muted">{order.dispute.note}</p>}
        </div>
      )}

      {/* Actions */}
      {(paid || pending || order.dispute?.status === "open") && (
        <div className="card space-y-3">
          <h3 className="font-semibold">Actions</h3>
          <textarea
            className="input"
            placeholder="Note / reason (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            {pending && (
              <button className="btn-outline" disabled={busy} onClick={reverify}>
                Re-verify payment
              </button>
            )}
            {paid && (
              <button className="btn-outline" disabled={busy} onClick={refund}>
                Refund order
              </button>
            )}
            {order.dispute?.status === "open" && (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={refundOnResolve} onChange={(e) => setRefundOnResolve(e.target.checked)} />
                  Refund on resolve
                </label>
                <button className="btn-primary" disabled={busy} onClick={() => resolveDispute("resolved")}>
                  Resolve
                </button>
                <button className="btn-outline" disabled={busy} onClick={() => resolveDispute("rejected")}>
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="mb-3 font-semibold">Timeline</h3>
        <ol className="space-y-2">
          {[...(order.events ?? [])].reverse().map((e, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
              <div>
                <p className="font-medium">{describeEvent(e.type)}</p>
                {e.note && <p className="text-xs text-muted">{e.note}</p>}
                <p className="text-xs text-muted">{new Date(e.at).toLocaleString()}</p>
              </div>
            </li>
          ))}
          {(order.events ?? []).length === 0 && <li className="text-sm text-muted">No events.</li>}
        </ol>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
