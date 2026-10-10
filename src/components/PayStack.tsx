import React from 'react';
import { PaystackButton } from 'react-paystack';
import { toMinorUnits } from '@/lib/money';

interface PaystackPaymentProps {
  email: string;
  /** Amount in major currency units (e.g. cedis). Converted to pesewas here. */
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
  currency: string;
}

const PaystackPayment: React.FC<PaystackPaymentProps> = ({
  email,
  amount,
  reference,
  onSuccess,
  onClose,
}) => {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY;

  if (!publicKey) {
    console.error(
      'Paystack public key (NEXT_PUBLIC_PAYSTACK_KEY) is not set. Check your environment variables.'
    );
    return null;
  }

  // Paystack expects the amount in the smallest currency unit (pesewas for GHS).
  const componentProps: PaystackButtonProps = {
    email,
    amount: toMinorUnits(amount),
    currency: 'GHS',
    metadata: {
      custom_fields: [],
    },
    publicKey,
    text: 'Pay Now',
    onSuccess,
    onClose,
    reference,
  };

  return <PaystackButton {...componentProps} />;
};

export default PaystackPayment;
