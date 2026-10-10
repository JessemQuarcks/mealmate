"use client";
import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAppSelector } from "@/lib/hook";
import { cartTotal } from "@/lib/money";

interface BoughtItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface RootState {
  cart: {
    boughtItems: BoughtItem[];
  };
}

// Order history currently comes from the locally persisted `boughtItems`.
// TODO(P4): fetch per-user orders from /api/orders once orders are bound to a
// signed-in user, so history follows the account across devices.
const OrderHistoryComponent: React.FC = () => {
  const items = useAppSelector((state: RootState) => state.cart.boughtItems) ?? [];

  return (
    <div className="p-5 max-w-screen-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Order History</h1>

      {items.length > 0 ? (
        <>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="p-4 border rounded-lg flex items-center gap-4">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 object-cover rounded-md"
                />
                <div>
                  <p className="text-lg font-semibold">{item.name}</p>
                  <p className="text-md text-gray-600">Price: GHS {item.price}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-right text-lg">
            Total spent: <b>GHS {cartTotal(items)}</b>
          </p>
        </>
      ) : (
        <p>No orders found yet.</p>
      )}
    </div>
  );
};

const OrderPage = dynamic(() => Promise.resolve(OrderHistoryComponent), { ssr: false });
export default OrderPage;
