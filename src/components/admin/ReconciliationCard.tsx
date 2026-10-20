"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FiRefreshCw } from "react-icons/fi";

interface Recon {
  byStatus: Record<string, number>;
  staleAfterMinutes: number;
  pendingTotal: number;
  stalePending: { _id: string; restaurant_name?: string; total_amount?: number }[];
}

const ReconciliationCard: React.FC = () => {
  const [data, setData] = useState<Recon | null>(null);

  useEffect(() => {
    fetch("/api/admin/reconciliation", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => b?.success && setData(b.data))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const stale = data.stalePending.length;
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Payment reconciliation</h3>
        <FiRefreshCw className="text-brand" />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="text-muted">Paid: <b className="text-fg">{data.byStatus.paid ?? 0}</b></span>
        <span className="text-muted">Pending: <b className="text-fg">{data.pendingTotal}</b></span>
        <span className="text-muted">Failed: <b className="text-fg">{data.byStatus.failed ?? 0}</b></span>
        <span className="text-muted">Refunded: <b className="text-fg">{data.byStatus.refunded ?? 0}</b></span>
      </div>
      <div className="mt-3">
        {stale === 0 ? (
          <p className="text-sm text-brand">Nothing stale — all pending payments are recent.</p>
        ) : (
          <p className="text-sm text-red-500">
            {stale} pending order{stale === 1 ? "" : "s"} older than {data.staleAfterMinutes} min need re-verifying.{" "}
            <Link href="/admin/orders?payment=pending" className="underline">
              Review
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ReconciliationCard;
