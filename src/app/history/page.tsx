"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

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

const STATUS_STYLES: Record<string, string> = {
  placed: "bg-blue-100 text-blue-700",
  accepted: "bg-indigo-100 text-indigo-700",
  preparing: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  out_for_delivery: "bg-emerald-100 text-emerald-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-600",
  rejected: "bg-red-100 text-red-700",
};

// Order history now comes from the server, scoped to the signed-in user, so it
// follows the account across devices (replaces the old local boughtItems).
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
    return <p className="p-5 max-w-screen-md mx-auto">Loading your orders…</p>;
  }
  if (state === "error") {
    return (
      <p className="p-5 max-w-screen-md mx-auto">
        Could not load your orders. Please{" "}
        <a href="/signin?callbackUrl=/history" className="text-blue-600 underline">
          sign in
        </a>{" "}
        and try again.
      </p>
    );
  }

  return (
    <div className="p-5 max-w-screen-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Order History</h1>

      {orders.length > 0 ? (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order._id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{order.restaurant_name || "Order"}</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
              <ul className="mt-2 text-sm text-gray-600">
                {order.products.map((p) => (
                  <li key={p.id}>
                    {p.name} × {p.quantity}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Payment: {order.payment?.status ?? "—"}
                </span>
                <span className="font-semibold">
                  {order.currency ?? "GHS"} {order.total_amount}
                </span>
              </div>
              {!["cancelled", "rejected"].includes(order.status) && (
                <a
                  href={`/track/${order._id}`}
                  className="mt-3 inline-block text-accent text-sm font-medium underline"
                >
                  {order.status === "delivered" ? "View details & rate →" : "Track order →"}
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No orders found yet.</p>
      )}
    </div>
  );
};

const OrderPage = dynamic(() => Promise.resolve(OrderHistoryComponent), { ssr: false });
export default OrderPage;
