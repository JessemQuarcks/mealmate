'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { FiTrash2 } from 'react-icons/fi';
import { useAppSelector, useAppDispatch } from '@/lib/hook';
import {
  calculateTotal,
  removeFromCart,
  clearCart,
  cartRestaurantId,
} from '@/lib/slice';
import { logger } from '@/lib/http';
import PaystackPayment from '../../components/PayStack';
import { initCheckout, verifyPayment, CheckoutInit } from '@/lib/checkoutClient';

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
  };
}

const CheckOutComponent: React.FC = () => {
  const cartItems = useAppSelector((state: RootState) => state.cart.cartItems);
  const totalCartCost = useAppSelector((state: RootState) => state.cart.totalCost) || 0;
  const restaurantId = useAppSelector(cartRestaurantId);
  const { data: session } = useSession();
  const dispatch = useAppDispatch();

  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [tip, setTip] = useState(0);
  const [checkout, setCheckout] = useState<CheckoutInit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(calculateTotal());
  }, [cartItems, dispatch]);

  // Step 1: ask the server to price the cart and open a pending order.
  const handleContinue = async () => {
    setError(null);
    if (!restaurantId) {
      setError('Add items from a restaurant before checking out.');
      return;
    }
    if (!line1.trim()) {
      setError('A delivery address is required.');
      return;
    }
    setBusy(true);
    try {
      const init = await initCheckout({
        restaurant_id: restaurantId,
        items: cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
        tip: tip > 0 ? tip : undefined,
        delivery_address: { line1: line1.trim(), city: city.trim() || undefined },
      });
      setCheckout(init);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout.');
    } finally {
      setBusy(false);
    }
  };

  // Step 2: Paystack succeeded in the browser — confirm it server-side.
  const handleSuccess = async () => {
    if (!checkout) return;
    try {
      await verifyPayment(checkout.reference);
      setConfirmed(true);
      dispatch(clearCart());
    } catch (e) {
      logger.error('Payment verification failed', e);
      setError(
        e instanceof Error ? e.message : 'We could not confirm your payment. Please contact support.'
      );
    }
  };

  const handleClose = () => logger.info('Payment dialog closed by user');
  const handleRemoveFromCart = (id: string) => dispatch(removeFromCart(id));

  if (confirmed) {
    return (
      <div className="max-w-screen-md mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Payment confirmed 🎉</h1>
        <p className="text-gray-600 mb-6">Your order is in. Follow it live from here.</p>
        <div className="flex gap-3 justify-center">
          {checkout && (
            <a href={`/track/${checkout.order_id}`} className="btn-primary">
              Track your order
            </a>
          )}
          <a href="/history" className="btn-outline">
            Order history
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto p-5">
      <h1 className="text-3xl border-b pb-4 text-center mb-5">Your Cart</h1>

      {cartItems && cartItems.length > 0 ? (
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 p-3 border rounded-lg"
            >
              <div>
                <div className="text-lg font-bold">{item.name}</div>
                <div className="text-sm text-gray-600">
                  GHS {item.price} × {item.quantity}
                </div>
              </div>
              <button
                aria-label={`Remove ${item.name} from cart`}
                onClick={() => handleRemoveFromCart(item.id)}
              >
                <FiTrash2 className="text-red-600" size={22} />
              </button>
            </div>
          ))}

          <div className="text-right text-lg">
            Items total: <b>GHS {totalCartCost}</b>
          </div>

          {!checkout ? (
            <div className="mt-6 space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold">Delivery details</h2>
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="Delivery address *"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
              />
              <input
                className="w-full border rounded-md px-3 py-2"
                placeholder="City (optional)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <label className="block">
                <span className="text-sm text-gray-600">Tip (GHS)</span>
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded-md px-3 py-2"
                  value={tip}
                  onChange={(e) => setTip(Math.max(0, Number(e.target.value) || 0))}
                />
              </label>

              {!session?.user?.email && (
                <p className="text-amber-600 text-sm">
                  Please{' '}
                  <a href="/signin?callbackUrl=/Checkout" className="underline">
                    sign in
                  </a>{' '}
                  to pay for your order.
                </p>
              )}

              <button
                disabled={busy || !session?.user?.email}
                onClick={handleContinue}
                className="w-full bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded-lg"
              >
                {busy ? 'Preparing…' : 'Continue to payment'}
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3 border-t pt-6">
              <h2 className="text-xl font-semibold">Payment</h2>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex justify-between"><span>Subtotal</span><span>GHS {checkout.totals.subtotal}</span></li>
                <li className="flex justify-between"><span>Delivery</span><span>GHS {checkout.totals.deliveryFee}</span></li>
                <li className="flex justify-between"><span>Service fee</span><span>GHS {checkout.totals.serviceFee}</span></li>
                {checkout.totals.tax > 0 && (
                  <li className="flex justify-between"><span>Tax</span><span>GHS {checkout.totals.tax}</span></li>
                )}
                {checkout.totals.tip > 0 && (
                  <li className="flex justify-between"><span>Tip</span><span>GHS {checkout.totals.tip}</span></li>
                )}
                <li className="flex justify-between font-bold border-t pt-1">
                  <span>Total</span><span>GHS {checkout.totals.grandTotal}</span>
                </li>
              </ul>
              <PaystackPayment
                email={checkout.email}
                amount={checkout.totals.grandTotal}
                reference={checkout.reference}
                onSuccess={handleSuccess}
                onClose={handleClose}
              />
            </div>
          )}
        </div>
      ) : (
        <p className="text-center">Your cart is empty.</p>
      )}

      {error && <p className="mt-4 text-center text-red-600">{error}</p>}
    </div>
  );
};

const ClientSideCheckOutComponent = dynamic(() => Promise.resolve(CheckOutComponent), {
  ssr: false,
});

export default ClientSideCheckOutComponent;
