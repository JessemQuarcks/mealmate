"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FiArrowRight, FiShoppingBag } from "react-icons/fi";
import StatusBadge from "@/components/ui/StatusBadge";

interface OrderProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  restaurant_name?: string;
  products: OrderProduct[];
  total_amount: number;
  currency?: string;
  status: string;
  payment?: { status: string };
  createdAt?: string;
}

// Order history comes from the server, scoped to the signed-in user, so it
// follows the account across devices.
const OrderHistoryComponent: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);
        const body = await res.json();
        if (active) {
          setOrders(body.data ?? []);
          setState("ready");
        }
      } catch {
        if (active) setState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="container my-10 max-w-2xl space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="container my-10 max-w-2xl">
        <p className="text-muted">
          Could not load your orders. Please{" "}
          <Link href="/signin?callbackUrl=/history" className="text-brand underline">
            sign in
          </Link>{" "}
          and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="container my-10 max-w-2xl">
      <h1 className="section-title mb-6">Your orders</h1>

      {orders.length > 0 ? (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order._id} className="card transition-all hover:border-brand/50">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{order.restaurant_name || "Order"}</p>
                <StatusBadge status={order.status} />
              </div>
              <ul className="mt-2 text-sm text-muted">
                {order.products.map((p) => (
                  <li key={p.id}>
                    {p.name} × {p.quantity}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="text-muted">Payment: {order.payment?.status ?? "—"}</span>
                <span className="font-semibold text-fg">
                  {order.currency ?? "GHS"} {order.total_amount}
                </span>
              </div>
              {!["cancelled", "rejected"].includes(order.status) && (
                <Link
                  href={`/track/${order._id}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand"
                >
                  {order.status === "delivered" ? "View details & rate" : "Track order"}
                  <FiArrowRight />
                </Link>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-brand">
            <FiShoppingBag size={24} />
          </div>
          <p className="text-muted">No orders yet. Hungry?</p>
          <Link href="/browse" className="btn-primary">
            Browse restaurants
          </Link>
        </div>
      )}
    </div>
  );
};

const OrderPage = dynamic(() => Promise.resolve(OrderHistoryComponent), { ssr: false });
export default OrderPage;
