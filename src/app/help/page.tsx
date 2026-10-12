import React from "react";

export const metadata = {
  title: "Help & FAQ — MealMate",
  description: "Answers to common questions about ordering, payment and delivery.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do I place an order?",
    a: "Open a restaurant from Discover, add items to your cart, then go to checkout. You'll add a delivery address and pay securely with Paystack.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. Payments go through Paystack and every transaction is verified on our server before an order is confirmed — the amount is computed server-side, never trusted from your browser.",
  },
  {
    q: "Can I track my order?",
    a: "Once a courier is on the way you can follow them live from Order History → Track order, with an estimated time of arrival.",
  },
  {
    q: "What if I need to cancel?",
    a: "You can cancel an order from your history up until it's out for delivery. Paid orders are refunded by the restaurant.",
  },
  {
    q: "How do I become a vendor or courier?",
    a: "Sign up and choose the vendor or courier role. An admin verifies your account, after which the vendor portal or courier app unlocks.",
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto my-12 px-4">
      <h1 className="section-title mb-2">Help &amp; FAQ</h1>
      <p className="text-gray-600 mb-8">
        Quick answers to the things people ask most. Still stuck? Reach out from the
        social links in the footer.
      </p>

      <div className="space-y-4">
        {FAQ.map((item) => (
          <details key={item.q} className="card group">
            <summary className="cursor-pointer font-semibold text-blackish list-none flex justify-between items-center">
              {item.q}
              <span className="text-accent group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-sm text-gray-600">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
