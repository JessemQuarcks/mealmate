import React from 'react';
import { PaystackButton } from 'react-paystack';
import { useAppDispatch, useAppSelector } from '@/lib/hook';
import { addToBought, clearCart } from '@/lib/slice';

interface PaystackPaymentProps {
  email: string;
  amount: number;
  reference: string;
  onSuccess: (response: any) => void;
  onClose: () => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image:string;
}

interface RootState {
  cart: {
    cartItems: CartItem[];
    totalCost: number;
  };
}

interface PaystackButtonProps {
  email: string;
  amount: number;
  metadata: {
    custom_fields: {
      display_name: string;
      variable_name: string;
      value: string;
    }[];
  };
  publicKey: string;
  text: string;
  onSuccess: (response: any) => void;
  onClose: () => void;
  reference: string;
  currency: string;
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({ email, amount, reference, onSuccess, onClose }) => {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY!;
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state: RootState) => state.cart.cartItems);

  console.log(cartItems)

  if (!publicKey) {
    console.error("Paystack public key is not defined. Please check your environment variables.");
  }

  const handlePaymentSuccess = (response: any) => {
    console.log("Payment successful!");
    console.log(response)
    const cartItemsCopy = Array.from(cartItems)
    if(response){
      dispatch(addToBought(cartItemsCopy))
    }
    // Dispatch the action to add items to the boughtItems list
    dispatch(addToBought(cartItems));
    console.log(cartItems)

    // Clear the cart after adding items to boughtItems
    dispatch(clearCart());
  };

  const componentProps: PaystackButtonProps = {
    email,
    amount: amount,
    currency: 'GHS',
    metadata: {
      custom_fields: [
        {
          display_name: "Mobile Number",
          variable_name: "mobile_number",
          value: "+233556947112",
        }
      ]
    },
    publicKey,
    text: "Pay Now",
    onSuccess: handlePaymentSuccess,
    onClose,
    reference,
  };

  return (
    <div>
      <PaystackButton {...componentProps} />
    </div>
  );
};

export default PaystackPayment;
