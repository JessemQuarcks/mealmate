// pages/checkout.tsx or components/CheckOutComponent.tsx
'use client';

import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hook';
import { calculateTotal, removeFromCart } from '@/lib/slice';
import dynamic from 'next/dynamic';
import PaystackPayment from '../../components/PayStack'; // Ensure the import path is correct
import { FiTrash2 } from 'react-icons/fi'; // Import the bin icon

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
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
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(calculateTotal());
  }, [cartItems, dispatch]);

  const handleSuccess = (reference: string) => {
    console.log('Payment successful, reference:', reference);
    // Handle post-payment actions (e.g., clear the cart, show a success message, etc.)
  };

  const handleClose = () => {
    console.log('Payment closed');
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
                <div key={item.id} className="h-200 w-200 place-content-center place-items-center flex gap-x-10 py-3">
                  <div className="flex flex-row items-center ml-1 gap-x-10">
                    <div className="text-2xl font-extrabold ">{item.name}</div>
                    <div className="flex-col">
                    <div className='text-lg'>Price: <b>GHS {item.price}</b> </div>
                    <div>Quantity: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button onClick={() => handleRemoveFromCart(item.id)}>
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
          <div className="flex flex-col items-center p-5 space-y-10 bg-white">
            <PaystackPayment
              email="emmanueljessequarcoo@gmail.com" // Replace with the customer's email
              amount={totalCartCost} // Amount in kobo
              reference={`ref-${Date.now()}`}
              onSuccess={handleSuccess}
              onClose={handleClose}
            />
            {/* <button className="bg-blue-500 text-white py-2 px-4 rounded">
              Pay Now
            </button> */}
          </div>
        )}
        <div className="flex flex-col p-5 space-y-10 bg-white">
          <h1 className="text-3xl border-b pb-4 text-center">Your Cart List</h1>
        </div>
      </div>
    </div>
  );
};

const ClientSideCheckOutComponent = dynamic(() => Promise.resolve(CheckOutComponent), { ssr: false });

export default ClientSideCheckOutComponent;
