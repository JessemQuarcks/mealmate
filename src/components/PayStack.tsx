// components/PaystackPayment.tsx
import React from 'react';
import { PaystackButton } from 'react-paystack';

interface PaystackPaymentProps {
  email: string;
  amount: number;
  reference: string;
  onSuccess: (response: any) => void;
  onClose: () => void;
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
  currency: string; // Add currency property
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({ email, amount, reference, onSuccess, onClose }) => {
  const publicKey = "pk_live_81b39c0d5a1d26453d074e5bee6c2162eb75585c"; // Replace with your Paystack public key

  const componentProps: PaystackButtonProps = {
    email,
    amount: amount,
    currency: 'GHS', // Add currency property
    metadata: {
      custom_fields: [
        {
          display_name: "Mobile Number",
          variable_name: "mobile_number",
          value: "+233556947112"
        }
      ]
    },
    publicKey,
    text: "Pay Now",
    onSuccess,
    onClose,
    reference,
  };
  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const orderData = {
        restaurant_id: paymentData.restaurant_id,
        restaurant_name: paymentData.restaurant_name,
        products: paymentData.products,
        total_amount: paymentData.total_amount,
        order_date: new Date(),
      };
  
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
  
      if (!res.ok) {
        throw new Error("Failed to save order");
      }
  
      console.log("Order saved successfully");
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  return (
    <div>
      <PaystackButton {...componentProps} />
    </div>
  );
};


export default PaystackPayment;
