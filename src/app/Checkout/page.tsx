'use client';

import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hook';
import { calculateTotal, removeFromCart, addToBought, clearCart } from '@/lib/slice';
import dynamic from 'next/dynamic';
import PaystackPayment from '../../components/PayStack';
import { FiTrash2 } from 'react-icons/fi';
import { logger } from '@/lib/http';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface RootState {
  cart: {
    cartItems: CartItem[];
    totalCost: number;
    boughtItems: CartItem[];
  };
}

const CheckOutComponent: React.FC = () => {
  const cartItems = useAppSelector((state: RootState) => state.cart.cartItems);
  const totalCartCost = useAppSelector((state: RootState) => state.cart.totalCost) || 0;
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(calculateTotal());
  }, [cartItems, dispatch]);

  // Persist the order only after a successful payment, with the full payload the
  // orders API now validates (products + total_amount).
  // TODO(P4): verify `response.reference` server-side before trusting success.
  const persistOrder = async (items: CartItem[], total: number) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: items, total_amount: total }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.errors?.join(', ') || 'Failed to save order');
      }
      return (await res.json()).data;
    } catch (error) {
      logger.error('Could not persist order', error);
      return null;
    }
  };

  const handleSuccess = async (response: any) => {
    const itemsSnapshot = [...cartItems];
    const totalSnapshot = totalCartCost;
    await persistOrder(itemsSnapshot, totalSnapshot);
    dispatch(addToBought(itemsSnapshot));
    dispatch(clearCart());
  };

  const handleClose = () => {
    logger.info('Payment dialog closed by user');
  };

  const handleRemoveFromCart = (id: string) => {
    dispatch(removeFromCart(id));
  };

  return (
    <div className="lg:flex max-w-screen-2xl mx-auto">
      <div className="flex-grow m-5 shadow-sm">
        <div>
          {cartItems && cartItems.length > 0 ? (
            <div className="place-items-center justify-items-center">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="h-200 w-200 place-content-center place-items-center flex gap-x-10 py-3"
                >
                  <div className="flex flex-row items-center ml-1 gap-x-10">
                    <div className="text-2xl font-extrabold">{item.name}</div>
                    <div className="flex-col">
                      <div className="text-lg">
                        Price: <b>GHS {item.price}</b>
                      </div>
                      <div>Quantity: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => handleRemoveFromCart(item.id)}
                    >
                      <FiTrash2 className="text-red-600" size={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center">Your cart is empty.</p>
          )}
        </div>

        {cartItems && cartItems.length > 0 && (
          <div className="flex flex-col items-center p-5 space-y-6 bg-white">
            <div className="text-xl">
              Total: <b>GHS {totalCartCost}</b>
            </div>
            <PaystackPayment
              email="customer@example.com" // TODO(P1): use the authenticated user's email
              amount={totalCartCost}
              reference={`ref-${Date.now()}`}
              onSuccess={handleSuccess}
              onClose={handleClose}
            />
          </div>
        )}

        <div className="flex flex-col p-5 space-y-10 bg-white">
          <h1 className="text-3xl border-b pb-4 text-center">Your Cart List</h1>
        </div>
      </div>
    </div>
  );
};

const ClientSideCheckOutComponent = dynamic(() => Promise.resolve(CheckOutComponent), {
  ssr: false,
});

export default ClientSideCheckOutComponent;
